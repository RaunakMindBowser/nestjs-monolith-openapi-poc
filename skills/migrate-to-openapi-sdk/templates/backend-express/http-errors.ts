// tsoa has no built-in exception hierarchy the way Nest does (no
// UnauthorizedException/ConflictException). These plain Error subclasses
// carry a `status` that error-handler.ts reads to produce the right HTTP
// response — throw these from services/controllers instead of a bare Error.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}
