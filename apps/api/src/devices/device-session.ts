import { SessionKind } from '../generated/prisma/client.js';
import type { Prisma } from '../generated/prisma/client.js';

/** A device session that still works: not revoked and not expired. Means "the app is connected". */
export function liveDeviceSessionWhere(
  now = new Date(),
): Prisma.SessionWhereInput {
  return {
    kind: SessionKind.DEVICE,
    revokedAt: null,
    expiresAt: { gt: now },
  };
}
