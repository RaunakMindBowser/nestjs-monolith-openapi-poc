// Deliberately short-lived by default (45s, not minutes) so a live demo can
// trigger a real access-token expiry within a minute of narration — no
// special "demo mode" flag needed, just wait.
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET ?? 'demo-access-secret';
export const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 45);
export const REFRESH_TOKEN_TTL_SECONDS = Number(process.env.REFRESH_TOKEN_TTL_SECONDS ?? 3600);
