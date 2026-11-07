import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '../generated/prisma/client.js';

/** The logged-in user, attached to the request by AuthGuard */
export interface AuthUser {
  userId: string;
  role: UserRole;
  sessionId: string;
  physiotherapistId: string | null; // set when role is PHYSIO
  patientId: string | null; // set when role is PATIENT
}

export type AuthRequest = Request & { user?: AuthUser };

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Route (or controller) that doesn't require login, e.g. POST /auth/login */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Only these roles may call the route (or controller) */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** Injects the logged-in user into a controller method: `me(@CurrentUser() user: AuthUser)` */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const user = ctx.switchToHttp().getRequest<AuthRequest>().user;
    if (!user) {
      throw new Error('@CurrentUser() used on a @Public() route');
    }
    return user;
  },
);
