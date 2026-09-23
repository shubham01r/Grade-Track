import axios from 'axios';
import type { Student } from '../types/student';

const DEMO_TOKEN = 'demo-bypass-token-2026';

const demoStudents: Student[] = [
  {
    id: 'demo-student-1',
    roll_number: 'GT-2024-001',
    full_name: 'Aarav Mehta',
    department: 'Computer Science',
    degree_type: 'UG',
    admission_year: 2024,
    cgpa: 9.2,
    scholarship_status: 'HONOR_ROLL',
    semesters: [{
      id: 'demo-semester-1', student_id: 'demo-student-1', semester_number: 3, academic_year: '2025-26',
      total_lectures: 40, attended_lectures: 38, attendance_percentage: 95, is_debarred: false,
      sgpa: 9.4, evaluation_status: 'EVALUATED',
      subjects: [{
        id: 'demo-subject-1', semester_id: 'demo-semester-1', subject_code: 'CS301', subject_name: 'Data Structures',
        subject_type: 'THEORY', credits: 4, theory_max_marks: 100, theory_marks_obtained: 92,
        practical_max_marks: null, practical_marks_obtained: null, total_marks_obtained: 92, grade_letter: 'O', grade_point: 10, is_backlog: false,
      }],
    }],
  },
  {
    id: 'demo-student-2', roll_number: 'GT-2024-014', full_name: 'Isha Nair', department: 'Computer Science',
    degree_type: 'UG', admission_year: 2024, cgpa: 8.6, scholarship_status: 'SCHOLARSHIP', semesters: [],
  },
];

function demoResponse(url = ''): unknown {
  if (url.includes('/leaderboard')) return demoStudents;
  if (url.includes('/students')) return demoStudents;
  if (url.includes('/settings/attendance-threshold')) return { attendance_threshold_percent: 75 };
  if (url.includes('/settings/grade-scale')) return [];
  if (url.includes('/assignments')) return [];
  return {};
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('gradetrack_token') ?? localStorage.getItem('gradetrack_token') ?? localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = sessionStorage.getItem('gradetrack_token') ?? localStorage.getItem('gradetrack_token') ?? localStorage.getItem('token');
    const config = error.config;

    if (token !== DEMO_TOKEN || !config) return Promise.reject(error);

    return Promise.resolve({
      ...config,
      config,
      data: config.method?.toLowerCase() === 'get' ? demoResponse(config.url) : {},
      headers: {},
      status: 200,
      statusText: 'OK',
    });
  },
);

export default apiClient;
