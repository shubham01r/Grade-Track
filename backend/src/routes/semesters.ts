import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';
import { attendanceUpdateSchema, evaluateSemesterSchema, subjectSchema } from '../validation/schemas.js';
import { calculateAttendanceGate, calculateCGPA, calculateScholarshipStatus, calculateSGPA, isBacklog, mapMarksToGrade } from '../services/evaluation/evaluation.js';

const router = Router();

router.use(requireAuth);

async function recalculateAcademicState(semesterId: string) {
  const semester = await prisma.semester.findUnique({ where: { id: semesterId }, include: { student: true, subjects: true } });
  if (!semester) throw new AppError('SEMESTER_NOT_FOUND', 'Semester not found.', 404);

  const evaluatedSubjects = semester.subjects.map((subject) => {
    const totalMarks = Number(subject.total_marks_obtained ?? 0);
    const mapped = mapMarksToGrade(totalMarks);
    return { ...subject, grade_letter: mapped.grade_letter, grade_point: mapped.grade_point, is_backlog: isBacklog(totalMarks, semester.student.degree_type) };
  });
  const attendancePass = calculateAttendanceGate(semester.attended_lectures, semester.total_lectures, 75);
  const sgpa = attendancePass ? calculateSGPA(evaluatedSubjects.map((subject) => ({ credits: subject.credits, grade_point: subject.grade_point ?? 0, total_marks_obtained: Number(subject.total_marks_obtained ?? 0), is_backlog: subject.is_backlog ?? false }))) : null;
  const otherSemesters = await prisma.semester.findMany({ where: { student_id: semester.student_id, id: { not: semester.id }, evaluation_status: 'EVALUATED' }, include: { subjects: true } });
  const semesterRecords = [...otherSemesters.map((item) => ({ sgpa: Number(item.sgpa ?? 0), credits: item.subjects.reduce((sum, subject) => sum + subject.credits, 0) })), ...(sgpa === null ? [] : [{ sgpa, credits: evaluatedSubjects.reduce((sum, subject) => sum + subject.credits, 0) }])];
  const cgpa = calculateCGPA(semesterRecords, Number(semester.student.cgpa ?? 0));
  const hasBacklog = evaluatedSubjects.some((subject) => subject.is_backlog);
  const scholarshipStatus = calculateScholarshipStatus(cgpa, hasBacklog);

  await prisma.$transaction(async (tx) => {
    await Promise.all(evaluatedSubjects.map((subject) => tx.subject.update({ where: { id: subject.id }, data: { grade_letter: subject.grade_letter, grade_point: subject.grade_point, is_backlog: subject.is_backlog } })));
    await tx.semester.update({ where: { id: semester.id }, data: { sgpa, evaluation_status: sgpa === null ? 'NOT_EVALUATED' : 'EVALUATED' } });
    await tx.student.update({ where: { id: semester.student_id }, data: { cgpa: semesterRecords.length ? cgpa : null, scholarship_status: scholarshipStatus } });
  });

  return { semesterId: semester.id, sgpa, cgpa: semesterRecords.length ? cgpa : null, scholarship_status: scholarshipStatus };
}

router.put('/:id/attendance', async (req, res, next) => {
  try {
    const parsed = attendanceUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('INVALID_ATTENDANCE', parsed.error.issues[0]?.message ?? 'Invalid attendance payload.', 400);
    }

    const semester = await prisma.semester.findUnique({ where: { id: req.params.id } });
    if (!semester) {
      throw new AppError('SEMESTER_NOT_FOUND', 'Semester not found.', 404);
    }

    const total_lectures = parsed.data.total_lectures ?? semester.total_lectures;
    const attended_lectures = parsed.data.attended_lectures ?? semester.attended_lectures;

    if (attended_lectures > total_lectures) {
      throw new AppError('INVALID_ATTENDANCE', 'Attended lectures cannot exceed total lectures.', 400);
    }

    const settings = await prisma.systemSettings.findFirst();
    const threshold = Number(settings?.attendance_threshold_percent ?? 75);
    const attendance_percentage = Number(((attended_lectures / total_lectures) * 100).toFixed(2));
    const is_debarred = attendance_percentage < threshold;

    const updated = await prisma.semester.update({
      where: { id: req.params.id },
      data: {
        total_lectures,
        attended_lectures,
        attendance_percentage,
        is_debarred,
      },
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/subjects', async (req, res, next) => {
  try {
    const parsed = subjectSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('INVALID_SUBJECT', parsed.error.issues[0]?.message ?? 'Invalid subject payload.', 400);
    }

    const semester = await prisma.semester.findUnique({ where: { id: req.params.id } });
    if (!semester) {
      throw new AppError('SEMESTER_NOT_FOUND', 'Semester not found.', 404);
    }

    const { theory_max_marks = 100, theory_marks_obtained = 0, practical_max_marks, practical_marks_obtained = 0 } = parsed.data;

    if (theory_marks_obtained > theory_max_marks) {
      throw new AppError('INVALID_MARKS', 'Theory marks cannot exceed the maximum marks.', 400);
    }

    if (practical_max_marks !== undefined && practical_marks_obtained > practical_max_marks) {
      throw new AppError('INVALID_MARKS', 'Practical marks cannot exceed the maximum marks.', 400);
    }

    const totalMarks = practical_max_marks !== undefined
      ? Number(theory_marks_obtained) + Number(practical_marks_obtained)
      : Number(theory_marks_obtained);

    const { grade_letter, grade_point } = mapMarksToGrade(totalMarks);

    const subject = await prisma.subject.create({
      data: {
        semester_id: req.params.id,
        subject_code: parsed.data.subject_code,
        subject_name: parsed.data.subject_name,
        subject_type: parsed.data.subject_type,
        credits: parsed.data.credits,
        theory_max_marks,
        theory_marks_obtained,
        practical_max_marks,
        practical_marks_obtained: practical_max_marks === undefined ? null : practical_marks_obtained,
        total_marks_obtained: totalMarks,
        grade_letter,
        grade_point,
        is_backlog: false,
      },
    });

    return res.status(201).json(subject);
  } catch (error) {
    next(error);
  }
});

router.put('/subjects/:id', async (req, res, next) => {
  try {
    const parsed = subjectSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('INVALID_SUBJECT', parsed.error.issues[0]?.message ?? 'Invalid subject update payload.', 400);
    }

    const subject = await prisma.subject.findUnique({ where: { id: req.params.id } });
    if (!subject) {
      throw new AppError('SUBJECT_NOT_FOUND', 'Subject not found.', 404);
    }

    const nextValues = {
      ...subject,
      ...parsed.data,
      theory_max_marks: parsed.data.theory_max_marks ?? subject.theory_max_marks,
      theory_marks_obtained: parsed.data.theory_marks_obtained ?? subject.theory_marks_obtained,
      practical_max_marks: parsed.data.practical_max_marks ?? subject.practical_max_marks,
      practical_marks_obtained: parsed.data.practical_marks_obtained ?? subject.practical_marks_obtained,
    };

    const finalTheoryMarks = nextValues.theory_marks_obtained ?? 0;
    const finalPracticalMarks = nextValues.practical_max_marks !== null && nextValues.practical_max_marks !== undefined
      ? (nextValues.practical_marks_obtained ?? 0)
      : 0;

    const theoMax = nextValues.theory_max_marks ?? 100;
    const pracMax = nextValues.practical_max_marks ?? null;

    if (finalTheoryMarks > theoMax) {
      throw new AppError('INVALID_MARKS', 'Theory marks cannot exceed the maximum marks.', 400);
    }

    if (pracMax !== null && finalPracticalMarks > pracMax) {
      throw new AppError('INVALID_MARKS', 'Practical marks cannot exceed the maximum marks.', 400);
    }

    const totalMarks = pracMax !== null ? finalTheoryMarks + finalPracticalMarks : finalTheoryMarks;
    const { grade_letter, grade_point } = mapMarksToGrade(totalMarks);

    const updated = await prisma.subject.update({
      where: { id: req.params.id },
      data: {
        ...parsed.data,
        theory_max_marks: theoMax,
        theory_marks_obtained: parsed.data.theory_marks_obtained ?? subject.theory_marks_obtained,
        practical_max_marks: parsed.data.practical_max_marks ?? subject.practical_max_marks,
        practical_marks_obtained: parsed.data.practical_marks_obtained ?? subject.practical_marks_obtained,
        total_marks_obtained: totalMarks,
        grade_letter,
        grade_point,
        is_backlog: false,
      },
    });

    await recalculateAcademicState(subject.semester_id);

    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/subjects/:id', async (req, res, next) => {
  try {
    const subject = await prisma.subject.findUnique({ where: { id: req.params.id } });
    if (!subject) {
      throw new AppError('SUBJECT_NOT_FOUND', 'Subject not found.', 404);
    }

    await prisma.subject.delete({ where: { id: req.params.id } });
    await recalculateAcademicState(subject.semester_id);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:id/evaluate', async (req, res, next) => {
  try {
    const parsed = evaluateSemesterSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      throw new AppError('INVALID_EVALUATION_PAYLOAD', parsed.error.issues[0]?.message ?? 'Invalid evaluation payload.', 400);
    }

    const semester = await prisma.semester.findUnique({
      where: { id: req.params.id },
      include: {
        student: true,
        subjects: true,
      },
    });

    if (!semester) {
      throw new AppError('SEMESTER_NOT_FOUND', 'Semester not found.', 404);
    }

    const settings = await prisma.systemSettings.findFirst();
    const threshold = Number(settings?.attendance_threshold_percent ?? 75);
    const attendancePass = calculateAttendanceGate(semester.attended_lectures, semester.total_lectures, threshold);

    if (!attendancePass) {
      throw new AppError('ATTENDANCE_GATE_FAILED', 'Attendance is below the configured threshold and this semester cannot be evaluated.', 409);
    }

    const evaluatedSubjects = semester.subjects.map((subject) => {
      const totalMarks = Number(subject.total_marks_obtained ?? 0);
      const { grade_letter, grade_point } = mapMarksToGrade(totalMarks);
      const backlog = isBacklog(totalMarks, semester.student.degree_type);

      return {
        ...subject,
        grade_letter,
        grade_point,
        is_backlog: backlog,
      };
    });

    const sgpa = calculateSGPA(
      evaluatedSubjects.map((subject) => ({
        credits: subject.credits,
        grade_point: subject.grade_point ?? 0,
        total_marks_obtained: Number(subject.total_marks_obtained ?? 0),
        is_backlog: subject.is_backlog ?? false,
      })),
    );

    const allSemesters = await prisma.semester.findMany({
      where: { student_id: semester.student_id, evaluation_status: { not: 'NOT_EVALUATED' } },
      include: { subjects: true },
    });

    const studentSemesters = allSemesters.length > 0 ? allSemesters : [semester];
    const semesterCredits = studentSemesters.map((item) => ({
      sgpa: Number(item.sgpa ?? sgpa),
      credits: item.subjects.reduce((sum, s) => sum + s.credits, 0),
    }));

    const cgpa = calculateCGPA(semesterCredits, Number(semester.student.cgpa ?? 0));
    const hasActiveBacklog = evaluatedSubjects.some((subject) => subject.is_backlog);
    const scholarshipStatus = calculateScholarshipStatus(cgpa, hasActiveBacklog);

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        evaluatedSubjects.map((subject) =>
          tx.subject.update({
            where: { id: subject.id },
            data: {
              grade_letter: subject.grade_letter,
              grade_point: subject.grade_point,
              is_backlog: subject.is_backlog,
            },
          }),
        ),
      );

      await tx.semester.update({
        where: { id: semester.id },
        data: {
          sgpa: Number(sgpa.toFixed(2)),
          evaluation_status: 'EVALUATED',
          is_debarred: false,
        },
      });

      await tx.student.update({
        where: { id: semester.student_id },
        data: {
          cgpa: Number(cgpa.toFixed(2)),
          scholarship_status: scholarshipStatus,
        },
      });
    });

    return res.json({
      semester_id: semester.id,
      sgpa: Number(sgpa.toFixed(2)),
      cgpa: Number(cgpa.toFixed(2)),
      scholarship_status: scholarshipStatus,
      subjects: evaluatedSubjects,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
