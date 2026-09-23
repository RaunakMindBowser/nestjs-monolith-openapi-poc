// GOTCHA: Nest wraps every route in an exception filter automatically — a
// thrown UnauthorizedException always becomes a real 401 JSON body. Express
// (and tsoa on top of it) does NOT do this. Without an error-handling
// middleware registered AFTER RegisterRoutes(app), every thrown error
// (auth rejections, tsoa's own ValidateError on a malformed body, anything
// else) falls through to Express's default handler, which returns a
// text/html 500 page — not the JSON error shape the generated client and
// ErrorResponseDto promise. Skipping this file is the single easiest way to
// make this migration look like it works in the happy path and then produce
// un-parseable errors on the first bad request.
//
// Wire this in the app entrypoint AFTER RegisterRoutes(app):
//   RegisterRoutes(app);
//   app.use(notFoundHandler);
//   app.use(errorHandler);
import type { NextFunction, Request, Response } from 'express';
import { ValidateError } from 'tsoa';
import { HttpError } from './http-errors';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ statusCode: 404, message: `Route ${req.method} ${req.path} not found` });
}

// Express recognizes an error-handling middleware ONLY by its 4-argument
// signature — dropping `next` (even unused) makes Express treat this as a
// normal middleware and it will never be called on error.
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof ValidateError) {
    // tsoa throws this when a request body/param doesn't match the
    // generated schema — the closest Express-side equivalent of Nest's
    // built-in ValidationPipe rejection.
    res.status(422).json({ statusCode: 422, message: 'Validation failed', details: err.fields });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ statusCode: err.status, message: err.message });
    return;
  }

  // expressAuthentication (see auth/authentication.ts) rejects with a plain
  // { status, message } object, not an Error instance — tsoa's generated
  // routes propagate that rejection here as-is.
  if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
    const { status, message } = err as { status: number; message: string };
    res.status(status).json({ statusCode: status, message });
    return;
  }

  console.error('[error-handler] unhandled error:', err);
  res.status(500).json({ statusCode: 500, message: 'Internal server error' });
}
