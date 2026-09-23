// Not a file to copy verbatim — this is a reference for merging into the
// target repo's REAL existing Express entrypoint (server.ts / app.ts /
// index.ts, whatever it's actually called there). There is no single
// "main.ts" the way NestFactory.create() gives Nest — find the file that
// currently calls `app.listen(...)` and merge these pieces into it in order.
import express from 'express';
import { RegisterRoutes } from './generated-routes/routes'; // written by `tsoa routes` / `tsoa spec-and-routes`
import { errorHandler, notFoundHandler } from './error-handler';

const app = express();

app.use(express.json());

// ... the target repo's EXISTING middleware/routes stay exactly where they
// are relative to this — don't reorder unrelated app.use() calls just to
// make this migration's diff look cleaner.

RegisterRoutes(app);

// Order matters: RegisterRoutes(app) must come before both of these, and
// errorHandler must be last (Express walks error middleware in registration
// order, and only after a route calls next(err) or throws).
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(process.env.PORT ?? 3000);
