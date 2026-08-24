import { PartialType } from '@nestjs/swagger';
import { CreatePatientDto } from './create-patient.dto';

// PartialType from @nestjs/swagger (not @nestjs/mapped-types) — it re-emits
// each field's @ApiProperty as optional, so the generated client actually
// sees the shape instead of an untyped blob. Same "every field optional"
// partial-update pattern as the Nx POC's UpdateItemRequest.
export class UpdatePatientDto extends PartialType(CreatePatientDto) {}
