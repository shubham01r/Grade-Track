import type { NextFunction, Request, Response } from 'express';
import { AppError, errorResponse } from '../utils/errors.js';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError('NOT_FOUND', 'Route not found.', 404));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof Error) {
    console.error('[api] Request failed:', err.stack ?? err.message);
  } else {
    console.error('[api] Request failed:', err);
  }

  if (err instanceof AppError) {
    return res.status(err.status).json(errorResponse(err.code, err.message));
  }

  if (err instanceof Error) {
    return res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred.'));
  }

  return res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred.'));
}
