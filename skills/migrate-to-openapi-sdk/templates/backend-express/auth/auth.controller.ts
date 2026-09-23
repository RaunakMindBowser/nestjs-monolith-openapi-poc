// tsoa's shape of a controller: a class extending `Controller` (from
// 'tsoa', not Express), with `@Route`/`@Post`/`@Body` decorators. tsoa parses
// this file's TypeScript AST to build the OpenAPI spec AND generates the
// real Express route handlers from it (`tsoa spec-and-routes` /
// `npm run generate:spec`) — there is no separate hand-written Express
// router for these paths once this exists.
//
// Deliberately no `@Security('bearerAuth')` on this controller — these
// routes are what issue the tokens `authentication.ts` checks elsewhere, so
// they must stay reachable without it.
//
// NOT a Nest-style gotcha here: tsoa's default success status is 200 for
// every method unless `@SuccessResponse` says otherwise — there's no
// "POST defaults to 201" surprise the way there is in Nest. Don't port that
// Nest-specific workaround over; verify the ACTUAL runtime status with curl
// regardless (gotcha checklist item still applies, the fix just doesn't).
import { Body, Controller, Post, Route, SuccessResponse, Tags } from 'tsoa';
import { authService } from './auth.service';
import type { AuthResponseDto } from './dto/auth-response.dto';
import type { LoginDto } from './dto/login.dto';
import type { LogoutRequestDto } from './dto/logout-request.dto';
import type { RefreshRequestDto } from './dto/refresh-request.dto';
import type { RegisterDto } from './dto/register.dto';

@Route('auth')
@Tags('Auth')
export class AuthController extends Controller {
  @Post('register')
  @SuccessResponse(201, 'Created')
  public async register(@Body() body: RegisterDto): Promise<AuthResponseDto> {
    this.setStatus(201);
    return authService.register(body.email, body.password, body.name);
  }

  @Post('login')
  @SuccessResponse(200)
  public async login(@Body() body: LoginDto): Promise<AuthResponseDto> {
    return authService.login(body.email, body.password);
  }

  @Post('refresh')
  @SuccessResponse(200)
  public async refreshToken(@Body() body: RefreshRequestDto): Promise<AuthResponseDto> {
    return authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @SuccessResponse(204, 'No Content')
  public async logout(@Body() body: LogoutRequestDto): Promise<void> {
    this.setStatus(204);
    authService.logout(body.refreshToken);
  }
}
