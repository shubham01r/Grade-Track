import { Router } from 'express';
import { SubmissionStatus } from '@prisma/client';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';

const router = Router();
router.use(requireAuth);

const assignmentSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.'),
  description: z.string().trim().optional(),
  department: z.string().trim().min(1, 'Department is required.'),
  semester: z.number().int().min(1).max(12),
  dueDate: z.string().datetime({ offset: true }),
  maxMarks: z.number().positive().default(100),
});

const submissionSchema = z.object({
  status: z.nativeEnum(SubmissionStatus).optional(),
  submittedAt: z.string().datetime({ offset: true }).nullable().optional(),
  obtainedMarks: z.number().min(0).nullable().optional(),
  feedback: z.string().nullable().optional(),
  submissionUrl: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
});

function submissionStats(submissions: Array<{ status: SubmissionStatus }>) {
  return {
    totalAssignedStudents: submissions.length,
    submittedCount: submissions.filter((submission) => submission.status === 'SUBMITTED' || submission.status === 'GRADED').length,
    pendingCount: submissions.filter((submission) => submission.status === 'PENDING').length,
    lateCount: submissions.filter((submission) => submission.status === 'LATE').length,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const { dept, semester } = req.query;
    const assignments = await prisma.assignment.findMany({
      where: {
        department: typeof dept === 'string' && dept.trim() ? dept.trim() : undefined,
        semester: typeof semester === 'string' && semester.trim() ? Number(semester) : undefined,
      },
      include: { submissions: { select: { status: true } } },
      orderBy: { dueDate: 'asc' },
    });

    return res.json(assignments.map(({ submissions, ...assignment }) => ({
      ...assignment,
      ...submissionStats(submissions),
    })));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = assignmentSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError('INVALID_ASSIGNMENT', parsed.error.issues[0]?.message ?? 'Invalid assignment payload.', 400);

    const assignment = await prisma.$transaction(async (tx) => {
      const created = await tx.assignment.create({
        data: {
          ...parsed.data,
          dueDate: new Date(parsed.data.dueDate),
        },
      });
      const students = await tx.student.findMany({
        where: {
          department: parsed.data.department,
          semesters: { some: { semester_number: parsed.data.semester } },
        },
        select: { id: true },
      });
      if (students.length > 0) {
        await tx.submission.createMany({
          data: students.map((student) => ({ assignmentId: created.id, studentId: student.id, status: SubmissionStatus.PENDING })),
          skipDuplicates: true,
        });
      }
      return tx.assignment.findUnique({ where: { id: created.id }, include: { submissions: true } });
    });

    return res.status(201).json({ ...assignment, ...submissionStats(assignment?.submissions ?? []) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id },
      include: { submissions: { include: { student: true }, orderBy: { student: { full_name: 'asc' } } } },
    });
    if (!assignment) throw new AppError('ASSIGNMENT_NOT_FOUND', 'Assignment not found.', 404);
    return res.json({ ...assignment, ...submissionStats(assignment.submissions) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:assignmentId/submissions/:studentId', async (req, res, next) => {
  try {
    const parsed = submissionSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError('INVALID_SUBMISSION', parsed.error.issues[0]?.message ?? 'Invalid submission payload.', 400);

    const existing = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId: req.params.assignmentId, studentId: req.params.studentId } },
    });
    if (!existing) throw new AppError('SUBMISSION_NOT_FOUND', 'Submission record not found for this student.', 404);

    const status = parsed.data.status ?? existing.status;
    const submittedAt = parsed.data.submittedAt === undefined
      ? (status === SubmissionStatus.PENDING ? null : existing.submittedAt ?? new Date())
      : (parsed.data.submittedAt ? new Date(parsed.data.submittedAt) : null);
    const updated = await prisma.submission.update({
      where: { id: existing.id },
      data: { ...parsed.data, status, submittedAt },
      include: { student: true },
    });
    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const assignment = await prisma.assignment.findUnique({ where: { id: req.params.id } });
    if (!assignment) throw new AppError('ASSIGNMENT_NOT_FOUND', 'Assignment not found.', 404);
    await prisma.assignment.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
