// tsoa's equivalent of Nest's JwtAuthGuard — but wired completely
// differently, and easy to get wrong if you go in expecting a decorator +
// class the way Nest guards work.
//
// tsoa has no per-route guard CLASS. Instead: tsoa.json's
// `routes.authenticationModule` points at THIS file, and every controller
// method decorated with `@Security('bearerAuth')` (see auth.controller.ts
// and any protected resource controller) has its generated route call the
// single function below before the handler runs. There is one
// `expressAuthentication` for the whole app, dispatched by `securityName`.
//
// GOTCHA: whatever this function resolves with is NOT automatically
// attached to `req.user` the way Nest's guard pattern does — tsoa only uses
// the resolved value for validation gating. To make the decoded principal
// available inside the controller method, this function mutates the real
// Express `request` object directly (tsoa passes the real request through),
// which is the standard workaround for this gap.
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET } from './jwt.constants';

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function expressAuthentication(
  request: Request,
  securityName: string,
  _scopes?: string[],
): Promise<AccessTokenPayload> {
  if (securityName !== 'bearerAuth') {
    return Promise.reject({ status: 500, message: `Unsupported security scheme: ${securityName}` });
  }

  const header = request.headers['authorization'];
  const token = typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : undefined;
  if (!token) {
    return Promise.reject({ status: 401, message: 'Missing access token' });
  }

  try {
    // Deliberately the same message for "expired" and "invalid" — both are
    // a plain 401, which is exactly the signal the SDK's response
    // interceptor keys off of to trigger a refresh (see configure.ts).
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
    request.user = payload;
    return Promise.resolve(payload);
  } catch {
    return Promise.reject({ status: 401, message: 'Invalid or expired access token' });
  }
}
