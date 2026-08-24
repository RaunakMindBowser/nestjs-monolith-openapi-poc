// Internal, server-only shape of a user record — never exported to the
// frontend. `passwordHash` must never appear in a response DTO, same
// discipline as PatientEntity's `ssn`/`riskScore` vs PatientResponseDto.
export interface UserEntity {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
}
