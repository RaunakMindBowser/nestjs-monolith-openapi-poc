import type { UserResponseDto } from './user-response.dto';

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  /**
   * @example "Bearer"
   */
  tokenType: string;
  /**
   * Access token lifetime in seconds
   */
  expiresIn: number;
  user: UserResponseDto;
}
