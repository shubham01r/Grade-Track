import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email is required.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
});

export const departmentSchema = z.enum([
  'Computer Science',
  'Electronics',
  'Mechanical',
  'Business Administration',
  'Information Technology',
]);

export const studentCreateSchema = z.object({
  roll_number: z.string().trim().min(1, 'Roll number is required.'),
  full_name: z.string().trim().min(1, 'Full name is required.'),
  department: departmentSchema,
  degree_type: z.enum(['UG', 'PG']),
  admission_year: z.number().int().min(2000),
});

export const studentUpdateSchema = studentCreateSchema.partial();

export const semesterCreateSchema = z.object({
  semester_number: z.number().int().min(1),
  academic_year: z.string().trim().min(1, 'Academic year is required.'),
  total_lectures: z.number().int().min(1),
  attended_lectures: z.number().int().min(0),
});

export const attendanceUpdateSchema = z.object({
  total_lectures: z.number().int().min(1).optional(),
  attended_lectures: z.number().int().min(0).optional(),
});

export const subjectSchema = z.object({
  subject_code: z.string().trim().min(1, 'Subject code is required.'),
  subject_name: z.string().trim().min(1, 'Subject name is required.'),
  subject_type: z.enum(['THEORY', 'LAB', 'THESIS', 'PRESENTATION']),
  credits: z.number().int().positive('Credits must be greater than zero.'),
  theory_max_marks: z.number().int().min(1).optional(),
  theory_marks_obtained: z.number().int().min(0).max(100).optional(),
  practical_max_marks: z.number().int().min(1).optional(),
  practical_marks_obtained: z.number().int().min(0).max(100).optional(),
});

export const settingsThresholdSchema = z.object({
  attendance_threshold_percent: z.number().min(0).max(100),
});

export const settingsGradeScaleSchema = z.array(
  z.object({
    marks_min: z.number().int().min(0),
    marks_max: z.number().int().min(0),
    grade_letter: z.string().trim().min(1),
    grade_point: z.number().int().min(0),
  }),
);

export const settingsScholarshipSchema = z.array(
  z.object({
    min_cgpa: z.number().min(0),
    max_cgpa: z.number().min(0).nullable().optional(),
    label: z.string().trim().min(1),
    status_code: z.enum(['SCHOLARSHIP', 'HONOR_ROLL', 'GOOD_STANDING', 'PROBATION']),
    requires_no_backlog: z.boolean().optional(),
  }),
);

export const evaluateSemesterSchema = z.object({
  force: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export type SemesterCreateInput = z.infer<typeof semesterCreateSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
