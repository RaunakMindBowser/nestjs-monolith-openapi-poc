// The internal, server-only shape of a patient record.
// This is intentionally NEVER exported to the frontend — see PatientResponseDto.
// It carries fields (ssn, riskScore) that must never leave the server, and
// Date objects that don't survive JSON serialization as Dates.
export interface PatientEntity {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  email: string;
  /** Sensitive — internal only. Must never be exposed via the API. */
  ssn: string;
  /** Computed by an internal risk model — not a public field. */
  riskScore: number;
  createdAt: Date;
}
