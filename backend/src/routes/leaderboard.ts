import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { dept, degree, batch } = req.query;

    const where: Record<string, any> = {};
    if (typeof dept === 'string' && dept.trim()) where.department = dept.trim();
    if (typeof degree === 'string' && degree.trim()) where.degree_type = degree.toUpperCase();
    if (typeof batch === 'string' && batch.trim()) where.admission_year = Number(batch);

    const students = await prisma.student.findMany({
      where,
      orderBy: [{ cgpa: 'desc' }, { full_name: 'asc' }],
      include: { semesters: { include: { subjects: true } } },
    });

    return res.json(students.filter((student) => student.cgpa !== null).map((student) => {
      const backlogCount = student.semesters
        .flatMap((semester) => semester.subjects)
        .filter((subject) => subject.is_backlog || subject.grade_letter === 'F' || Number(subject.total_marks_obtained ?? 0) < (student.degree_type === 'PG' ? 50 : 40))
        .length;

      return {
        ...student,
        backlogCount,
        academicStatus: student.scholarship_status ?? (backlogCount > 0 ? 'PROBATION' : 'GOOD_STANDING'),
        rank: null,
      };
    }));
  } catch (error) {
    next(error);
  }
});

export default router;
