import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshRequestDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}
