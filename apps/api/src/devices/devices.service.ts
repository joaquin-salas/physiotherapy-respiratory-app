import { ConflictException, Injectable } from '@nestjs/common';
import { PAIRING_CODE_TTL_MS } from '../auth/auth.constants.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { generatePairingCode } from '../auth/pairing-code.js';
import { hashToken } from '../auth/session-token.js';
import { SessionKind } from '../generated/prisma/client.js';
import { liveDeviceSessionWhere } from './device-session.js';
import { PatientsService } from '../patients/patients.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * The patient app's connection, seen from the panel: printing a connection sheet
 * (pairing code), seeing which device is connected, and disconnecting it.
 * The app itself redeems the code in AuthService.pair().
 */
@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patientsService: PatientsService,
  ) {}

  /** Connected device (if any) and whether a printed sheet is still waiting to be used */
  async getStatus(user: AuthUser, patientId: string) {
    const patient = await this.patientsService.findOne(user, patientId); // 404 if not visible
    const now = new Date();

    const [session, account] = await Promise.all([
      this.prisma.session.findFirst({
        where: { userId: patient.userId, ...liveDeviceSessionWhere(now) },
        orderBy: { createdAt: 'desc' },
        select: { deviceName: true, createdAt: true, lastUsedAt: true },
      }),
      this.prisma.user.findUniqueOrThrow({
        where: { id: patient.userId },
        select: { pairingCodeExpiresAt: true },
      }),
    ]);

    const codeExpiresAt = account.pairingCodeExpiresAt;
    return {
      device: session && {
        name: session.deviceName,
        connectedAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
      },
      // A sheet that hasn't been used yet (null once used, replaced or expired)
      pendingCodeExpiresAt:
        codeExpiresAt && codeExpiresAt > now ? codeExpiresAt : null,
    };
  }

  /**
   * New code for a connection sheet. Replaces any previous code (that sheet stops working).
   * Returns the raw code: it's never stored, so it can only be shown now.
   */
  async createPairingCode(user: AuthUser, patientId: string) {
    const patient = await this.patientsService.findOne(user, patientId);
    if (patient.dischargedAt) {
      throw new ConflictException("This patient's follow-up has ended");
    }

    const code = generatePairingCode();
    const expiresAt = new Date(Date.now() + PAIRING_CODE_TTL_MS);
    await this.prisma.user.update({
      where: { id: patient.userId },
      data: {
        pairingCodeHash: hashToken(code),
        pairingCodeExpiresAt: expiresAt,
      },
    });

    return { code, expiresAt };
  }

  /** Disconnects the patient app (e.g. a lost phone). The patient will need a new sheet. */
  async disconnect(user: AuthUser, patientId: string) {
    const patient = await this.patientsService.findOne(user, patientId);
    await this.prisma.session.updateMany({
      where: {
        userId: patient.userId,
        kind: SessionKind.DEVICE,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }
}
