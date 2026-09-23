import { ApiProperty } from '@nestjs/swagger';

// Shared error shape across the API. If the target app already has an error
// DTO/interceptor producing a consistent error envelope, use that instead of
// this file — don't introduce a second error shape alongside an existing one.
export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({ example: 'Not found' })
  message!: string;
}
