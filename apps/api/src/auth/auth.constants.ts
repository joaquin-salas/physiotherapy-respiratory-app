/** Name of the cookie that carries the physio panel's session token */
export const SESSION_COOKIE = 'session';

/** Physio panel sessions last 72 hours from login */
export const WEB_SESSION_TTL_MS = 72 * 60 * 60 * 1000;

/** Patient app sessions end after 90 days *without use*: every use pushes the expiry forward */
export const DEVICE_SESSION_IDLE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/** A printed connection sheet (pairing code) is valid for 30 days */
export const PAIRING_CODE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Don't write lastUsedAt on every request: only when it's older than this */
export const LAST_USED_UPDATE_INTERVAL_MS = 5 * 60 * 1000;
