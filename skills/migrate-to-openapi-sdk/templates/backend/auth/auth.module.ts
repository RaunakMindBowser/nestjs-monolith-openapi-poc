import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { RefreshTokenStore } from './refresh-token.store';

@Module({
  controllers: [AuthController],
  providers: [AuthService, UsersService, RefreshTokenStore],
})
export class AuthModule {}
