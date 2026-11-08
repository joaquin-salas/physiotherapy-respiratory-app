import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SessionKind, UserRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  DEVICE_SESSION_IDLE_TTL_MS,
  LAST_USED_UPDATE_INTERVAL_MS,
  WEB_SESSION_TTL_MS,
} from './auth.constants.js';
import type { AuthUser } from './auth.decorators.js';
import { normalizePairingCode } from './pairing-code.js';
import { hashPassword, verifyPassword } from './password.js';
import { generateToken, hashToken } from './session-token.js';

/** Same message for every pairing failure: never say whether a code exists */
const INVALID_CODE = 'Invalid or expired code';

@Injectable()
export class AuthService {
  // Used when the email doesn't exist, so the response takes as long as a wrong
  // password. Otherwise response times would reveal which emails have accounts.
  private readonly dummyHash = hashPassword('timing-equalizer');

  constructor(private readonly prisma: PrismaService) {}

  /** Checks email + password and opens a WEB session. Returns the raw token (only time it exists). */
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    const passwordOk = await verifyPassword(
      user?.passwordHash ?? (await this.dummyHash),
      password,
    );

    // Same error for every failure: never say which part was wrong
    if (!user?.passwordHash || !passwordOk || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + WEB_SESSION_TTL_MS);

    await this.prisma.$transaction([
      this.prisma.session.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          kind: 'WEB',
          expiresAt,
        },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    return { token, expiresAt, userId: user.id };
  }

  /**
   * Patient app: exchanges the code from the printed sheet for a DEVICE session.
   * The code works once. A patient has one device at a time, so any previous one is disconnected.
   * Returns the raw token (only time it exists).
   */
  async pair(rawCode: string, deviceName?: string) {
    const code = normalizePairingCode(rawCode);
    if (!code) throw new BadRequestException(INVALID_CODE);
    const codeHash = hashToken(code);

    const user = await this.prisma.user.findUnique({
      where: { pairingCodeHash: codeHash },
      include: { patient: { select: { dischargedAt: true } } },
    });
    const now = new Date();
    if (
      !user ||
      user.role !== UserRole.PATIENT ||
      !user.isActive ||
      !user.patient ||
      user.patient.dischargedAt ||
      !user.pairingCodeExpiresAt ||
      user.pairingCodeExpiresAt <= now
    ) {
      throw new BadRequestException(INVALID_CODE);
    }

    const token = generateToken();
    await this.prisma.$transaction(async (tx) => {
      // Use the code up. The condition on the hash makes this atomic: if two phones
      // scan the same sheet at once, only one of them updates the row.
      const claimed = await tx.user.updateMany({
        where: { id: user.id, pairingCodeHash: codeHash },
        data: {
          pairingCodeHash: null,
          pairingCodeExpiresAt: null,
          lastLoginAt: now,
        },
      });
      if (claimed.count !== 1) throw new BadRequestException(INVALID_CODE);

      await tx.session.updateMany({
        where: { userId: user.id, kind: SessionKind.DEVICE, revokedAt: null },
        data: { revokedAt: now },
      });
      await tx.session.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          kind: SessionKind.DEVICE,
          deviceName: deviceName?.trim() || null,
          expiresAt: new Date(now.getTime() + DEVICE_SESSION_IDLE_TTL_MS),
        },
      });
    });

    return { token };
  }

  /** Looks up the session for a token. Returns null if it's unknown, expired, revoked or the user is disabled. */
  async validateSession(token: string): Promise<AuthUser | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        user: {
          include: {
            physiotherapist: { select: { id: true } },
            patient: { select: { id: true } },
          },
        },
      },
    });

    const now = Date.now();
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= now ||
      !session.user.isActive
    ) {
      return null;
    }

    if (now - session.lastUsedAt.getTime() > LAST_USED_UPDATE_INTERVAL_MS) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          lastUsedAt: new Date(now),
          // The patient app stays logged in while it's used: push its expiry forward
          expiresAt:
            session.kind === SessionKind.DEVICE
              ? new Date(now + DEVICE_SESSION_IDLE_TTL_MS)
              : undefined,
        },
      });
    }

    return {
      userId: session.user.id,
      role: session.user.role,
      sessionId: session.id,
      physiotherapistId: session.user.physiotherapist?.id ?? null,
      patientId: session.user.patient?.id ?? null,
    };
  }

  async logout(sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** What the panel needs to know about the logged-in user */
  getMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        email: true,
        physiotherapist: { select: { id: true, fullName: true } },
      },
    });
  }
}
