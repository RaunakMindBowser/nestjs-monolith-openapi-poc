import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../http-errors';
import { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_TTL_SECONDS } from './jwt.constants';
import { RefreshTokenStore } from './refresh-token.store';
import type { UserEntity } from './user.entity';
import { UsersService } from './users.service';
import type { AuthResponseDto } from './dto/auth-response.dto';

// No DI container assumed here (plain Express has none by default) — these
// are constructed as module-level singletons and imported directly by
// auth.controller.ts. If the target repo already has a DI setup (tsyringe,
// inversify, tsoa's own `iocModule`), wire this through that instead.
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly refreshTokens: RefreshTokenStore,
  ) {}

  async register(email: string, password: string, name: string): Promise<AuthResponseDto> {
    const user = await this.users.create(email, password, name);
    return this.issueTokenPair(user);
  }

  async login(email: string, password: string): Promise<AuthResponseDto> {
    const user = this.users.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedError('Invalid credentials');
    }
    return this.issueTokenPair(user);
  }

  refresh(refreshToken: string): AuthResponseDto {
    // Leave this breadcrumb in (or something like it) for the live demo — it
    // makes the single-flight/concurrency guarantee visible in the terminal:
    // fire several requests at once right at expiry and this line should
    // print exactly ONCE despite multiple concurrent 401s upstream.
    console.log('[auth] /auth/refresh called');
    const consumed = this.refreshTokens.consumeAndRotate(refreshToken);
    if (!consumed) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
    const user = this.users.findById(consumed.userId);
    if (!user) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
    return this.issueTokenPair(user);
  }

  logout(refreshToken: string): void {
    this.refreshTokens.revoke(refreshToken);
  }

  private issueTokenPair(user: UserEntity): AuthResponseDto {
    const accessToken = jwt.sign({ sub: user.id, email: user.email }, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });
    const refreshToken = this.refreshTokens.issue(user.id);
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}

export const authService = new AuthService(new UsersService(), new RefreshTokenStore());
