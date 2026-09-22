import { Router } from 'express';
import { stringify } from 'csv-stringify/sync';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';

const router = Router();

router.use(requireAuth);

router.get('/csv', async (req, res, next) => {
  try {
    const { dept, degree, batch, studentId } = req.query;

    const where: Record<string, any> = {};
    if (typeof dept === 'string' && dept.trim()) where.department = dept.trim();
    if (typeof degree === 'string' && degree.trim()) where.degree_type = degree.toUpperCase();
    if (typeof batch === 'string' && batch.trim()) where.admission_year = Number(batch);
    if (typeof studentId === 'string' && studentId.trim()) where.id = studentId;

    const students = await prisma.student.findMany({
      where,
      include: { semesters: { include: { subjects: true } } },
      orderBy: [{ department: 'asc' }, { full_name: 'asc' }],
    });

    const rows = [
      ['Student ID', 'Roll Number', 'Full Name', 'Department', 'Degree', 'CGPA', 'Scholarship Status', 'Semester Count'],
      ...students.map((student) => [
        student.id,
        student.roll_number,
        student.full_name,
        student.department,
        student.degree_type,
        student.cgpa ?? '',
        student.scholarship_status ?? '',
        student.semesters.length,
      ]),
    ];

    const csv = stringify(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="gradetrack-export.csv"');
    return res.send(csv);
  } catch (error) {
    next(error);
  }
});

export default router;
