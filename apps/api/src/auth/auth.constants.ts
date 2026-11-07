/** Name of the cookie that carries the physio panel's session token */
export const SESSION_COOKIE = 'session';

/** Physio panel sessions last 72 hours from login */
export const WEB_SESSION_TTL_MS = 72 * 60 * 60 * 1000;

/** Don't write lastUsedAt on every request: only when it's older than this */
export const LAST_USED_UPDATE_INTERVAL_MS = 5 * 60 * 1000;
