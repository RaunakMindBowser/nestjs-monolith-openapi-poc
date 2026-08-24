import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { REFRESH_TOKEN_TTL_SECONDS } from './jwt.constants';

interface RefreshTokenRecord {
  userId: string;
  expiresAt: number;
}

// One-time-use, rotating refresh tokens: every successful consumeAndRotate()
// deletes the token it was given before issuing a new one. Replaying an
// already-consumed token is indistinguishable from an unknown one — this is
// what makes reuse detection possible without any extra bookkeeping.
@Injectable()
export class RefreshTokenStore {
  private readonly tokens = new Map<string, RefreshTokenRecord>();

  issue(userId: string): string {
    const token = randomBytes(32).toString('hex');
    this.tokens.set(token, { userId, expiresAt: Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000 });
    return token;
  }

  /** Returns the associated userId and deletes the token, or null if unknown/expired. */
  consumeAndRotate(token: string): { userId: string } | null {
    const record = this.tokens.get(token);
    this.tokens.delete(token);
    if (!record || record.expiresAt < Date.now()) return null;
    return { userId: record.userId };
  }

  revoke(token: string): void {
    this.tokens.delete(token);
  }
}
