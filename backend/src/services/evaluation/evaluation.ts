export type DegreeType = 'UG' | 'PG';
export type ScholarshipStatus = 'SCHOLARSHIP' | 'HONOR_ROLL' | 'GOOD_STANDING' | 'PROBATION';

export type GradeScaleRow = {
  marks_min: number;
  marks_max: number;
  grade_letter: string;
  grade_point: number;
};

export type SubjectEvaluationInput = {
  credits: number;
  grade_point: number;
  total_marks_obtained: number;
  is_backlog?: boolean;
};

export type StudentAcademicState = {
  degree_type: DegreeType;
  cgpa: number;
  has_active_backlog: boolean;
};

export const DEFAULT_GRADE_SCALE: GradeScaleRow[] = [
  { marks_min: 90, marks_max: 100, grade_letter: 'O', grade_point: 10 },
  { marks_min: 80, marks_max: 89, grade_letter: 'A+', grade_point: 9 },
  { marks_min: 70, marks_max: 79, grade_letter: 'A', grade_point: 8 },
  { marks_min: 60, marks_max: 69, grade_letter: 'B', grade_point: 7 },
  { marks_min: 50, marks_max: 59, grade_letter: 'C', grade_point: 6 },
  { marks_min: 40, marks_max: 49, grade_letter: 'D', grade_point: 5 },
  { marks_min: 0, marks_max: 39, grade_letter: 'F', grade_point: 0 },
];

export const DEFAULT_SCHOLARSHIP_RULES = [
  {
    min_cgpa: 9.0,
    max_cgpa: Number.POSITIVE_INFINITY,
    label: "100% Academic Merit Scholarship & Dean's List",
    status_code: 'SCHOLARSHIP',
    requires_no_backlog: true,
  },
  {
    min_cgpa: 8.0,
    max_cgpa: 8.99,
    label: 'Merit Honor Roll',
    status_code: 'HONOR_ROLL',
    requires_no_backlog: false,
  },
  {
    min_cgpa: 0,
    max_cgpa: 4.99,
    label: 'Academic Probation (Counseling Required)',
    status_code: 'PROBATION',
    requires_no_backlog: false,
  },
  {
    min_cgpa: 5.0,
    max_cgpa: 7.99,
    label: 'Good Standing',
    status_code: 'GOOD_STANDING',
    requires_no_backlog: false,
  },
] as const;

export function mapMarksToGrade(totalMarks: number, rules: GradeScaleRow[] = DEFAULT_GRADE_SCALE): { grade_letter: string; grade_point: number } {
  const normalized = Number(totalMarks);
  const match = rules.find((rule) => normalized >= rule.marks_min && normalized <= rule.marks_max);

  if (!match) {
    return { grade_letter: 'F', grade_point: 0 };
  }

  return {
    grade_letter: match.grade_letter,
    grade_point: match.grade_point,
  };
}

export function isBacklog(totalMarks: number, degreeType: DegreeType): boolean {
  const passThreshold = degreeType === 'UG' ? 40 : 50;
  return totalMarks < passThreshold;
}

export function calculateSGPA(subjects: SubjectEvaluationInput[]): number {
  if (subjects.length === 0) {
    return 0;
  }

  const totalCredits = subjects.reduce((sum, subject) => sum + subject.credits, 0);

  if (totalCredits === 0) {
    return 0;
  }

  const weightedSum = subjects.reduce((sum, subject) => sum + subject.credits * subject.grade_point, 0);
  return Number((weightedSum / totalCredits).toFixed(2));
}

export function calculateCGPA(
  semesterRecords: Array<{ sgpa: number; credits: number }>,
  previouslyComputedCgpa?: number,
): number {
  if (semesterRecords.length === 0) {
    return previouslyComputedCgpa ?? 0;
  }

  const totalCredits = semesterRecords.reduce((sum, item) => sum + item.credits, 0);

  if (totalCredits === 0) {
    return previouslyComputedCgpa ?? 0;
  }

  const weightedSum = semesterRecords.reduce((sum, item) => sum + item.sgpa * item.credits, 0);
  return Number((weightedSum / totalCredits).toFixed(2));
}

export function calculateAttendanceGate(attendedLectures: number, totalLectures: number, thresholdPercent = 75): boolean {
  if (totalLectures <= 0) {
    return false;
  }

  const attendancePercent = (attendedLectures / totalLectures) * 100;
  return attendancePercent >= thresholdPercent;
}

export function calculateScholarshipStatus(
  cgpa: number,
  hasActiveBacklog: boolean,
  rules = DEFAULT_SCHOLARSHIP_RULES,
): ScholarshipStatus {
  const sorted = [...rules].sort((a, b) => b.min_cgpa - a.min_cgpa);

  for (const rule of sorted) {
    const min = Number(rule.min_cgpa);
    const max = rule.max_cgpa === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : Number(rule.max_cgpa);

    if (cgpa >= min && cgpa <= max) {
      if (rule.requires_no_backlog && hasActiveBacklog) {
        continue;
      }

      return rule.status_code as ScholarshipStatus;
    }
  }

  return 'GOOD_STANDING';
}
