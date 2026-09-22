import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';

const router = Router();

router.use(requireAuth);

router.get('/students/:id/report', async (req, res, next) => {
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

    return res.json({
      student,
      report: {
        total_semesters: student.semesters.length,
        total_credits: student.semesters.reduce((sum, semester) => sum + semester.subjects.reduce((s, subject) => s + subject.credits, 0), 0),
        active_backlogs: student.semesters.reduce((sum, semester) => sum + semester.subjects.filter((subject) => subject.is_backlog).length, 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
