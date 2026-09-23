import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorResponseDto } from '../error-response.dto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';
import { LogoutRequestDto } from './dto/logout-request.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

// Deliberately no guard on this controller — these routes are what issue the
// tokens JwtAuthGuard checks elsewhere, so they must stay reachable without one.
//
// GOTCHA: Nest defaults every @Post() to HTTP 201, regardless of what
// @ApiResponse documents. login/refresh are semantically 200 OK (they don't
// create a resource) — without the explicit @HttpCode(200) below, the actual
// runtime response is 201 while the generated spec/client says 200. This is
// the exact kind of contract drift this whole approach exists to prevent, so
// don't skip it just because the endpoint "obviously" isn't creating anything.
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ operationId: 'register', summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 409, type: ErrorResponseDto })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.auth.register(dto.email, dto.password, dto.name);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ operationId: 'login', summary: 'Log in and receive an access/refresh token pair' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ operationId: 'refreshToken', summary: 'Exchange a refresh token for a new token pair' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  refreshToken(@Body() dto: RefreshRequestDto): AuthResponseDto {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ operationId: 'logout', summary: 'Revoke a refresh token' })
  @ApiResponse({ status: 204, description: 'Revoked' })
  logout(@Body() dto: LogoutRequestDto): void {
    this.auth.logout(dto.refreshToken);
  }
}
