import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
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

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = req.headers['authorization'];
    const token = typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : undefined;
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }
    try {
      req.user = jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
      return true;
    } catch {
      // Deliberately the same message for "expired" and "invalid" — both are
      // a plain 401, which is exactly the signal the SDK's response
      // interceptor keys off of to trigger a refresh (see configure.ts).
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
