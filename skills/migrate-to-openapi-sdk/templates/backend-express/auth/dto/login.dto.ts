// GOTCHA: tsoa generates the schema (and does request validation) from
// this interface's structural TYPE SHAPE alone — there's no class-validator
// equivalent bundled in. `password: string` guarantees "a string was sent",
// not "at least 8 characters" the way Nest's `@MinLength(8)` did. tsoa
// supports some JSDoc validation tags (`@minLength`, `@maxLength`,
// `@pattern`) on interface fields — verify the exact supported tag set
// against the installed tsoa version's docs before relying on one, they've
// changed across versions. If a field's business-rule validation actually
// matters here, enforce it explicitly in auth.service.ts rather than
// assuming the interface shape does it.
export interface LoginDto {
  /**
   * @example "jane.doe@example.com"
   */
  email: string;
  /**
   * @example "correct horse battery staple"
   */
  password: string;
}
