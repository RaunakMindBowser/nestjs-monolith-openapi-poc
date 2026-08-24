import { listPatients, createPatient, updatePatient, deletePatient } from '@org/api-client';
import type { PatientsApi } from '@org/api-client';

/**
 * Every type below — PatientResponseDto, CreatePatientDto, UpdatePatientDto —
 * came from the Nest controller's decorators via generate-spec.ts. Nobody on
 * the frontend wrote an interface. There is no "PatientDTO" hand-copied here
 * the way there is in the real codebase's admin/patient/@types/index.ts.
 */

export async function fetchPatients(): Promise<PatientsApi.PatientResponseDto[]> {
  const result = await listPatients();
  if (result.error) throw new Error('Failed to load patients');
  return result.data!;
}

export async function addPatient(
  input: PatientsApi.CreatePatientDto,
): Promise<PatientsApi.PatientResponseDto> {
  const result = await createPatient({ body: input });
  if (result.error) throw new Error(result.error.message);
  return result.data!;
}

export async function removePatient(id: string): Promise<void> {
  const result = await deletePatient({ path: { id } });
  if (result.error) throw new Error(result.error.message);
}

export async function editPatient(
  id: string,
  input: PatientsApi.UpdatePatientDto,
): Promise<PatientsApi.PatientResponseDto> {
  const result = await updatePatient({ path: { id }, body: input });
  if (result.error) throw new Error(result.error.message);
  return result.data!;
}
