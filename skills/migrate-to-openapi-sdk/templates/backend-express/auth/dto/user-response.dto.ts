// The PUBLIC contract for a user — deliberately narrower than the internal
// UserEntity. `passwordHash` (or any other internal-only field) does not
// exist here and cannot leak through the generated client.
export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
}
