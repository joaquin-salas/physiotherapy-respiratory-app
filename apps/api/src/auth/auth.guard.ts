import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../generated/prisma/client.js';
import { SESSION_COOKIE } from './auth.constants.js';
import { AuthRequest, IS_PUBLIC_KEY, ROLES_KEY } from './auth.decorators.js';
import { AuthService } from './auth.service.js';

/**
 * Registered globally (APP_GUARD), so every route requires login unless it's @Public().
 * 1. Reads the token from the `session` cookie (web panel) or `Authorization: Bearer` (mobile app)
 * 2. Validates it and attaches the user to the request      → 401 if missing or invalid
 * 3. Checks @Roles(...) if the route declares them           → 403 if the role isn't allowed
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];

    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = extractToken(request);
    const user = token ? await this.authService.validateSession(token) : null;
    if (!user) {
      throw new UnauthorizedException();
    }
    request.user = user;

    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      targets,
    );
    if (roles && !roles.includes(user.role)) {
      throw new ForbiddenException();
    }

    return true;
  }
}

function extractToken(request: AuthRequest): string | null {
  const cookies = request.cookies as Record<string, unknown> | undefined;
  const cookie = cookies?.[SESSION_COOKIE];
  if (typeof cookie === 'string' && cookie) {
    return cookie;
  }

  const [scheme, value] = request.headers.authorization?.split(' ') ?? [];
  return scheme === 'Bearer' && value ? value : null;
}
