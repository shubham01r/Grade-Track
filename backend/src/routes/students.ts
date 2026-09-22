import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';
import { semesterCreateSchema, studentCreateSchema, studentUpdateSchema } from '../validation/schemas.js';

const router = Router();

router.use(requireAuth);

router.post('/', async (req, res, next) => {
  try {
    const parsed = studentCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('INVALID_STUDENT', parsed.error.issues[0]?.message ?? 'Invalid student data.', 400);
    }

    const existing = await prisma.student.findUnique({
      where: { roll_number: parsed.data.roll_number },
    });

    if (existing) {
      throw new AppError('ROLL_NUMBER_EXISTS', 'A student with this roll number already exists.', 409);
    }

    const student = await prisma.student.create({ data: parsed.data });
    return res.status(201).json(student);
  } catch (error) {
    console.error('[students] GET /api/v1/students failed:', error);
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { dept, degree, batch, search } = req.query;

    const where: Record<string, any> = {};
    if (typeof dept === 'string' && dept.trim()) where.department = dept.trim();
    if (typeof degree === 'string' && degree.trim()) where.degree_type = degree.toUpperCase();
    if (typeof batch === 'string' && batch.trim()) where.admission_year = Number(batch);
    if (typeof search === 'string' && search.trim()) {
      where.OR = [
        { full_name: { contains: search.trim(), mode: 'insensitive' } },
        { roll_number: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      orderBy: [{ department: 'asc' }, { full_name: 'asc' }],
      include: { semesters: true },
    });

    return res.json(students);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        semesters: {
          include: { subjects: true },
          orderBy: { semester_number: 'asc' },
        },
      },
    });

    if (!student) {
      throw new AppError('STUDENT_NOT_FOUND', 'Student not found.', 404);
    }

    return res.json(student);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const parsed = studentUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('INVALID_STUDENT', parsed.error.issues[0]?.message ?? 'Invalid student update payload.', 400);
    }

    const existing = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new AppError('STUDENT_NOT_FOUND', 'Student not found.', 404);
    }

    if (parsed.data.roll_number && parsed.data.roll_number !== existing.roll_number) {
      const duplicate = await prisma.student.findUnique({ where: { roll_number: parsed.data.roll_number } });
      if (duplicate) {
        throw new AppError('ROLL_NUMBER_EXISTS', 'A student with this roll number already exists.', 409);
      }
    }

    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    return res.json(student);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (!student) {
      throw new AppError('STUDENT_NOT_FOUND', 'Student not found.', 404);
    }

    await prisma.student.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:id/semesters', async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (!student) {
      throw new AppError('STUDENT_NOT_FOUND', 'Student not found.', 404);
    }

    const parsed = semesterCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('INVALID_SEMESTER', parsed.error.issues[0]?.message ?? 'Invalid semester payload.', 400);
    }

    const { attended_lectures, total_lectures } = parsed.data;
    if (attended_lectures > total_lectures) {
      throw new AppError('INVALID_ATTENDANCE', 'Attended lectures cannot exceed total lectures.', 400);
    }

    const semester = await prisma.semester.create({
      data: {
        student_id: req.params.id,
        ...parsed.data,
        attendance_percentage: Number(((attended_lectures / total_lectures) * 100).toFixed(2)),
        is_debarred: false,
      },
    });

    const attendanceThreshold = await prisma.systemSettings.findFirst();
    const threshold = Number(attendanceThreshold?.attendance_threshold_percent ?? 75);
    const percentage = (attended_lectures / total_lectures) * 100;

    await prisma.semester.update({
      where: { id: semester.id },
      data: {
        is_debarred: percentage < threshold,
        attendance_percentage: Number(percentage.toFixed(2)),
      },
    });

    return res.status(201).json({ ...semester, attendance_percentage: Number(percentage.toFixed(2)), is_debarred: percentage < threshold });
  } catch (error) {
    next(error);
  }
});

export default router;
