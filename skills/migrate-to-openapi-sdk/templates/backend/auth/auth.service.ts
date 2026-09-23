import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { UsersService } from './users.service';
import { RefreshTokenStore } from './refresh-token.store';
import { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_TTL_SECONDS } from './jwt.constants';
import { UserEntity } from './user.entity';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
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
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokenPair(user);
  }

  refresh(refreshToken: string): AuthResponseDto {
    // Leave this breadcrumb in (or something like it) for the live demo — it
    // makes the single-flight/concurrency guarantee visible in the terminal:
    // fire several requests at once right at expiry and this line should
    // print exactly ONCE despite multiple concurrent 401s upstream.
    // eslint-disable-next-line no-console
    console.log('[auth] /auth/refresh called');
    const consumed = this.refreshTokens.consumeAndRotate(refreshToken);
    if (!consumed) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const user = this.users.findById(consumed.userId);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
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
