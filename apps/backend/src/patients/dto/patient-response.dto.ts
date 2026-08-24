import { ApiProperty } from '@nestjs/swagger';

// The PUBLIC contract for a patient. This is what the spec describes and what
// the generated frontend client sees — deliberately narrower than PatientEntity.
//
// Two things worth noticing when comparing this to PatientEntity:
//  1. `ssn` and `riskScore` do not exist here. They cannot leak through the
//     generated client because they were never in the contract to begin with.
//  2. `dateOfBirth` and `createdAt` are declared as `string` (ISO format),
//     because that's what actually crosses the wire as JSON — even though the
//     entity holds real `Date` objects. A hand-copied "just import the entity"
//     type would get this wrong.
export class PatientResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  mrn!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ format: 'date', example: '1990-05-14' })
  dateOfBirth!: string;

  @ApiProperty({ enum: ['MALE', 'FEMALE', 'OTHER'] })
  gender!: 'MALE' | 'FEMALE' | 'OTHER';

  @ApiProperty()
  email!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}
