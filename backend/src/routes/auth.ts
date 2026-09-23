import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { loginSchema } from '../validation/schemas.js';
import { AppError, errorResponse } from '../utils/errors.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid login payload.';
      throw new AppError('INVALID_LOGIN', message, 400);
    }

    const { email, password } = parsed.data;
    console.info(`[auth] Login attempt for ${email}`);
    const admin = await prisma.adminUser.findUnique({ where: { email } });

    if (!admin) {
      console.warn(`[auth] Login failed for ${email}: admin not found`);
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    }

    const matches = await bcrypt.compare(password, admin.password_hash);
    if (!matches) {
      console.warn(`[auth] Login failed for ${email}: password mismatch`);
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    }

    console.info(`[auth] Login successful for ${email}`);

    const secret = process.env.JWT_SECRET ?? 'development-secret';
    const token = jwt.sign({ id: admin.id, email: admin.email }, secret, { expiresIn: '1d' });

    return res.json({
      token,
      user: {
        id: admin.id,
        name: 'GradeTrack Admin',
        email: admin.email,
        role: 'ADMIN',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
