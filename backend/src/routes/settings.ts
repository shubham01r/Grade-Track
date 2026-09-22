import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';
import { settingsGradeScaleSchema, settingsScholarshipSchema, settingsThresholdSchema } from '../validation/schemas.js';

const router = Router();

router.use(requireAuth);

router.get('/attendance-threshold', async (_req, res, next) => {
  try {
    const settings = await prisma.systemSettings.findFirst();
    return res.json({ attendance_threshold_percent: Number(settings?.attendance_threshold_percent ?? 75) });
  } catch (error) {
    next(error);
  }
});

router.put('/attendance-threshold', async (req, res, next) => {
  try {
    const parsed = settingsThresholdSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('INVALID_SETTINGS', parsed.error.issues[0]?.message ?? 'Invalid settings payload.', 400);
    }

    const existing = await prisma.systemSettings.findFirst();
    const settings = existing
      ? await prisma.systemSettings.update({
          where: { id: existing.id },
          data: { attendance_threshold_percent: parsed.data.attendance_threshold_percent },
        })
      : await prisma.systemSettings.create({
          data: { attendance_threshold_percent: parsed.data.attendance_threshold_percent },
        });

    return res.json({ attendance_threshold_percent: Number(settings.attendance_threshold_percent) });
  } catch (error) {
    next(error);
  }
});

router.get('/grade-scale', async (_req, res, next) => {
  try {
    const rows = await prisma.gradeScaleRule.findMany({ orderBy: [{ marks_min: 'desc' }] });
    return res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.put('/grade-scale', async (req, res, next) => {
  try {
    const parsed = settingsGradeScaleSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('INVALID_SETTINGS', parsed.error.issues[0]?.message ?? 'Invalid grade scale payload.', 400);
    }

    await prisma.gradeScaleRule.deleteMany();
    const rows = await prisma.gradeScaleRule.createMany({
      data: parsed.data.map((row) => ({
        marks_min: row.marks_min,
        marks_max: row.marks_max,
        grade_letter: row.grade_letter,
        grade_point: row.grade_point,
      })),
    });

    return res.json({ count: rows.count });
  } catch (error) {
    next(error);
  }
});

router.get('/scholarship-rules', async (_req, res, next) => {
  try {
    const rows = await prisma.scholarshipRule.findMany({ orderBy: { min_cgpa: 'desc' } });
    return res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.put('/scholarship-rules', async (req, res, next) => {
  try {
    const parsed = settingsScholarshipSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('INVALID_SETTINGS', parsed.error.issues[0]?.message ?? 'Invalid scholarship rules payload.', 400);
    }

    await prisma.scholarshipRule.deleteMany();
    const rows = await prisma.scholarshipRule.createMany({
      data: parsed.data.map((row) => ({
        min_cgpa: row.min_cgpa,
        max_cgpa: row.max_cgpa ?? null,
        label: row.label,
        status_code: row.status_code,
        requires_no_backlog: row.requires_no_backlog ?? true,
      })),
    });

    return res.json({ count: rows.count });
  } catch (error) {
    next(error);
  }
});

export default router;
