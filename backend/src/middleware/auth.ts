import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHORIZED', 'Authentication required.', 401));
  }

  const token = authHeader.substring('Bearer '.length);

  try {
    const secret = process.env.JWT_SECRET ?? 'development-secret';
    const decoded = jwt.verify(token, secret) as { id: string; email: string };
    req.user = { id: decoded.id, email: decoded.email };
    return next();
  } catch (_error) {
    return next(new AppError('INVALID_TOKEN', 'Invalid or expired token.', 401));
  }
}
