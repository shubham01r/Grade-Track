export type Student = {
  id: string;
  roll_number: string;
  full_name: string;
  department: string;
  degree_type: 'UG' | 'PG';
  admission_year: number;
  cgpa: number | null;
  scholarship_status: 'SCHOLARSHIP' | 'HONOR_ROLL' | 'GOOD_STANDING' | 'PROBATION' | null;
  backlogCount?: number;
  academicStatus?: 'SCHOLARSHIP' | 'HONOR_ROLL' | 'GOOD_STANDING' | 'PROBATION';
  created_at?: string;
  updated_at?: string;
  semesters?: Semester[];
};

export type Semester = {
  id: string;
  student_id: string;
  semester_number: number;
  academic_year: string;
  total_lectures: number;
  attended_lectures: number;
  attendance_percentage: number | null;
  is_debarred: boolean | null;
  sgpa: number | null;
  evaluation_status: 'NOT_EVALUATED' | 'EVALUATED' | 'NEEDS_REEVALUATION';
  created_at?: string;
  updated_at?: string;
  subjects?: Subject[];
};

export type Subject = {
  id: string;
  semester_id: string;
  subject_code: string;
  subject_name: string;
  subject_type: 'THEORY' | 'LAB' | 'THESIS' | 'PRESENTATION';
  credits: number;
  theory_max_marks: number;
  theory_marks_obtained: number | null;
  practical_max_marks: number | null;
  practical_marks_obtained: number | null;
  total_marks_obtained: number | null;
  grade_letter: string | null;
  grade_point: number | null;
  is_backlog: boolean | null;
};

export type StudentStatusBadge = {
  label: string;
  tone: 'scholarship' | 'backlog' | 'debarred' | 'good';
};
