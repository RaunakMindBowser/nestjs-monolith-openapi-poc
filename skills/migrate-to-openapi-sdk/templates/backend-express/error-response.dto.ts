// Shared error shape across the API — kept structurally identical to the
// NestJS track's error-response.dto.ts on purpose, so the frontend's
// AuthenticationManager (backend-agnostic) can read `result.error.message`
// the same way regardless of which backend track produced it.
//
// If the target app already has an error envelope shape, match THAT instead
// and update error-handler.ts's JSON bodies to produce it — don't introduce
// a second error shape alongside an existing one.
export interface ErrorResponseDto {
  /**
   * @example 404
   */
  statusCode: number;
  /**
   * @example "Not found"
   */
  message: string;
}
