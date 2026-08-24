import { ApiProperty } from '@nestjs/swagger';

// The PUBLIC contract for a user — deliberately narrower than UserEntity.
// `passwordHash` does not exist here and cannot leak through the generated
// client, same discipline as PatientResponseDto vs PatientEntity.
export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;
}
