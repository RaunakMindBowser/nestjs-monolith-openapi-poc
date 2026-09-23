// See login.dto.ts's gotcha comment — tsoa validates structural shape, not
// business rules like "valid email" or "min length" unless you add its
// JSDoc validation tags explicitly.
export interface RegisterDto {
  /**
   * @example "jane.doe@example.com"
   */
  email: string;
  /**
   * @example "correct horse battery staple"
   */
  password: string;
  /**
   * @example "Jane Doe"
   */
  name: string;
}
