import express, { type NextFunction, type Request, type Response } from 'express';
import crypto from 'node:crypto';

import { notificationsRouter } from './routes/notifications.js';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.use((request: Request, response: Response, next: NextFunction) => {
    response.locals.correlationId =
      request.header('x-correlation-id') ?? crypto.randomUUID();
    next();
  });

  app.get('/health', (_request: Request, response: Response) => {
    response.json({ status: 'ok' });
  });

  app.use('/', notificationsRouter);

  app.use((request: Request, response: Response) => {
    response.status(404).json({
      code: 'NOT_FOUND',
      message: `Route ${request.method} ${request.path} was not found.`,
      correlationId: String(response.locals.correlationId)
    });
  });

  return app;
}

export const app = createApp();
