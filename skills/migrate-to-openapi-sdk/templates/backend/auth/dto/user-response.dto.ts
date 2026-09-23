import { ApiProperty } from '@nestjs/swagger';

// The PUBLIC contract for a user — deliberately narrower than the internal
// user entity/model. `passwordHash` (or any other internal-only field) does
// not exist here and cannot leak through the generated client.
export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;
}
