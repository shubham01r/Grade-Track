import { PrismaClient, ScholarshipRuleStatusCode, SubjectType, DegreeType, ScholarshipStatus, SemesterEvaluationStatus, SubmissionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const existingSettings = await prisma.systemSettings.findFirst();
  if (!existingSettings) {
    await prisma.systemSettings.create({
      data: {
        attendance_threshold_percent: 75.0,
      },
    });
  }

  const scaleRows = [
    { marks_min: 90, marks_max: 100, grade_letter: 'O', grade_point: 10 },
    { marks_min: 80, marks_max: 89, grade_letter: 'A+', grade_point: 9 },
    { marks_min: 70, marks_max: 79, grade_letter: 'A', grade_point: 8 },
    { marks_min: 60, marks_max: 69, grade_letter: 'B', grade_point: 7 },
    { marks_min: 50, marks_max: 59, grade_letter: 'C', grade_point: 6 },
    { marks_min: 40, marks_max: 49, grade_letter: 'D', grade_point: 5 },
    { marks_min: 0, marks_max: 39, grade_letter: 'F', grade_point: 0 },
  ];

  for (const row of scaleRows) {
    const existing = await prisma.gradeScaleRule.findFirst({
      where: {
        marks_min: row.marks_min,
        marks_max: row.marks_max,
      },
    });

    if (!existing) {
      await prisma.gradeScaleRule.create({ data: row });
    }
  }

  const scholarshipRows = [
    {
      min_cgpa: 9.0,
      max_cgpa: null,
      label: "100% Academic Merit Scholarship & Dean's List",
      status_code: ScholarshipRuleStatusCode.SCHOLARSHIP,
      requires_no_backlog: true,
    },
    {
      min_cgpa: 8.0,
      max_cgpa: 8.99,
      label: 'Merit Honor Roll',
      status_code: ScholarshipRuleStatusCode.HONOR_ROLL,
      requires_no_backlog: false,
    },
    {
      min_cgpa: 0.0,
      max_cgpa: 4.99,
      label: 'Academic Probation (Counseling Required)',
      status_code: ScholarshipRuleStatusCode.PROBATION,
      requires_no_backlog: false,
    },
    {
      min_cgpa: 5.0,
      max_cgpa: 7.99,
      label: 'Good Standing',
      status_code: ScholarshipRuleStatusCode.GOOD_STANDING,
      requires_no_backlog: false,
    },
  ];

  for (const row of scholarshipRows) {
    const existing = await prisma.scholarshipRule.findFirst({
      where: {
        label: row.label,
      },
    });

    if (!existing) {
      await prisma.scholarshipRule.create({
        data: {
          min_cgpa: row.min_cgpa,
          max_cgpa: row.max_cgpa ?? undefined,
          label: row.label,
          status_code: row.status_code,
          requires_no_backlog: row.requires_no_backlog,
        },
      });
    }
  }

  const adminEmail = 'admin@gradetrack.local';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD ?? 'Password123!';
  const hashed = await bcrypt.hash(adminPassword, 10);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { password_hash: hashed },
    create: {
      email: adminEmail,
      password_hash: hashed,
    },
  });

  await prisma.student.deleteMany({ where: { roll_number: 'GT-ADMIN-001' } });

  type DemoSubject = {
    code: string;
    name: string;
    type: SubjectType;
    credits: number;
    theoryMarks: number;
    grade: string;
    point: number;
    practicalMarks?: number;
  };

  type DemoPersona = {
    rollNumber: string;
    fullName: string;
    department: string;
    degreeType: DegreeType;
    attendedLectures: number;
    totalLectures: number;
    sgpa: number | null;
    cgpa: number | null;
    scholarshipStatus: ScholarshipStatus;
    evaluationStatus: SemesterEvaluationStatus;
    subjects: DemoSubject[];
  };

  const demoPersonas: DemoPersona[] = [
    {
      rollNumber: 'GT-2025-101',
      fullName: 'Aarav Sharma',
      department: 'Computer Science',
      degreeType: DegreeType.UG,
      attendedLectures: 47,
      totalLectures: 50,
      sgpa: 9.6,
      cgpa: 9.6,
      scholarshipStatus: ScholarshipStatus.SCHOLARSHIP,
      evaluationStatus: SemesterEvaluationStatus.EVALUATED,
      subjects: [
        { code: 'CS301', name: 'Advanced Algorithms', type: SubjectType.THEORY, credits: 4, theoryMarks: 96, grade: 'O', point: 10 },
        { code: 'CS302', name: 'Distributed Systems', type: SubjectType.THEORY, credits: 4, theoryMarks: 92, grade: 'O', point: 10 },
        { code: 'CS303', name: 'Machine Learning', type: SubjectType.THEORY, credits: 3, theoryMarks: 88, grade: 'A+', point: 9 },
        { code: 'CS304', name: 'Cloud Computing Lab', type: SubjectType.LAB, credits: 2, theoryMarks: 94, practicalMarks: 96, grade: 'O', point: 10 },
      ],
    },
    {
      rollNumber: 'GT-2025-102',
      fullName: 'Rohan Verma',
      department: 'Electronics',
      degreeType: DegreeType.UG,
      attendedLectures: 31,
      totalLectures: 50,
      sgpa: null,
      cgpa: null,
      scholarshipStatus: ScholarshipStatus.GOOD_STANDING,
      evaluationStatus: SemesterEvaluationStatus.NOT_EVALUATED,
      subjects: [
        { code: 'EC301', name: 'Embedded Systems', type: SubjectType.THEORY, credits: 4, theoryMarks: 78, grade: 'A', point: 8 },
        { code: 'EC302', name: 'Digital Signal Processing', type: SubjectType.THEORY, credits: 4, theoryMarks: 72, grade: 'A', point: 8 },
        { code: 'EC303', name: 'Microcontroller Lab', type: SubjectType.LAB, credits: 2, theoryMarks: 80, practicalMarks: 82, grade: 'A+', point: 9 },
      ],
    },
    {
      rollNumber: 'GT-2025-103',
      fullName: 'Karan Singhania',
      department: 'Information Technology',
      degreeType: DegreeType.UG,
      attendedLectures: 40,
      totalLectures: 50,
      sgpa: 4.8,
      cgpa: 4.8,
      scholarshipStatus: ScholarshipStatus.PROBATION,
      evaluationStatus: SemesterEvaluationStatus.EVALUATED,
      subjects: [
        { code: 'IT301', name: 'Database Systems', type: SubjectType.THEORY, credits: 4, theoryMarks: 32, grade: 'F', point: 0 },
        { code: 'IT302', name: 'Computer Networks', type: SubjectType.THEORY, credits: 4, theoryMarks: 35, grade: 'F', point: 0 },
        { code: 'IT303', name: 'Web Engineering', type: SubjectType.THEORY, credits: 4, theoryMarks: 48, grade: 'D', point: 5 },
        { code: 'IT304', name: 'Programming Lab', type: SubjectType.LAB, credits: 2, theoryMarks: 50, practicalMarks: 48, grade: 'C', point: 6 },
      ],
    },
    {
      rollNumber: 'GT-2025-104',
      fullName: 'Ananya Iyer',
      department: 'Information Technology',
      degreeType: DegreeType.UG,
      attendedLectures: 43,
      totalLectures: 50,
      sgpa: 7.75,
      cgpa: 7.75,
      scholarshipStatus: ScholarshipStatus.GOOD_STANDING,
      evaluationStatus: SemesterEvaluationStatus.EVALUATED,
      subjects: [
        { code: 'IT401', name: 'Software Architecture', type: SubjectType.THEORY, credits: 4, theoryMarks: 74, grade: 'A', point: 8 },
        { code: 'IT402', name: 'Information Security', type: SubjectType.THEORY, credits: 4, theoryMarks: 68, grade: 'B', point: 7 },
        { code: 'IT403', name: 'Human Computer Interaction', type: SubjectType.THEORY, credits: 2, theoryMarks: 72, grade: 'A', point: 8 },
        { code: 'IT404', name: 'Application Development Lab', type: SubjectType.LAB, credits: 2, theoryMarks: 65, practicalMarks: 70, grade: 'B', point: 7 },
      ],
    },
    {
      rollNumber: 'GT-2025-105',
      fullName: 'Vikram Malhotra',
      department: 'Information Technology',
      degreeType: DegreeType.PG,
      attendedLectures: 45,
      totalLectures: 50,
      sgpa: 9.15,
      cgpa: 9.15,
      scholarshipStatus: ScholarshipStatus.SCHOLARSHIP,
      evaluationStatus: SemesterEvaluationStatus.EVALUATED,
      subjects: [
        { code: 'PG501', name: 'Research Methodology', type: SubjectType.THEORY, credits: 3, theoryMarks: 91, grade: 'O', point: 10 },
        { code: 'PG502', name: 'Advanced Data Analytics', type: SubjectType.THEORY, credits: 4, theoryMarks: 87, grade: 'A+', point: 9 },
        { code: 'PG503', name: 'Cloud Security', type: SubjectType.THEORY, credits: 3, theoryMarks: 84, grade: 'A+', point: 9 },
        { code: 'PG504', name: 'Thesis and Project', type: SubjectType.THESIS, credits: 6, theoryMarks: 90, grade: 'O', point: 10 },
      ],
    },
  ];

  for (const persona of demoPersonas) {
    const attendancePercentage = Number(((persona.attendedLectures / persona.totalLectures) * 100).toFixed(2));
    const student = await prisma.student.upsert({
      where: { roll_number: persona.rollNumber },
      update: {
        full_name: persona.fullName,
        department: persona.department,
        degree_type: persona.degreeType,
        admission_year: 2025,
        cgpa: persona.cgpa,
        scholarship_status: persona.scholarshipStatus,
      },
      create: {
        roll_number: persona.rollNumber,
        full_name: persona.fullName,
        department: persona.department,
        degree_type: persona.degreeType,
        admission_year: 2025,
        cgpa: persona.cgpa,
        scholarship_status: persona.scholarshipStatus,
      },
    });

    await prisma.semester.deleteMany({ where: { student_id: student.id } });
    const semester = await prisma.semester.create({
      data: {
        student_id: student.id,
        semester_number: 1,
        academic_year: '2025-26',
        total_lectures: persona.totalLectures,
        attended_lectures: persona.attendedLectures,
        attendance_percentage: attendancePercentage,
        is_debarred: attendancePercentage < 75,
        sgpa: persona.sgpa,
        evaluation_status: persona.evaluationStatus,
      },
    });

    await prisma.subject.createMany({
      data: persona.subjects.map((subject) => {
        const hasPractical = subject.practicalMarks !== undefined;
        const totalMarks = hasPractical ? subject.theoryMarks + subject.practicalMarks! : subject.theoryMarks;

        return {
          semester_id: semester.id,
          subject_code: subject.code,
          subject_name: subject.name,
          subject_type: subject.type,
          credits: subject.credits,
          theory_max_marks: 100,
          theory_marks_obtained: subject.theoryMarks,
          practical_max_marks: hasPractical ? 100 : null,
          practical_marks_obtained: hasPractical ? subject.practicalMarks : null,
          total_marks_obtained: totalMarks,
          grade_letter: subject.grade,
          grade_point: subject.point,
          is_backlog: subject.grade === 'F',
        };
      }),
    });

    console.info(`Seeded ${persona.rollNumber}: ${persona.fullName}`);
  }

  const demoAssignmentTitles = ['Data Structures Lab - Assignment 1', 'Microprocessor Mini-Project'];
  await prisma.assignment.deleteMany({ where: { title: { in: demoAssignmentTitles } } });
  const demoStudents = await prisma.student.findMany({
    where: { roll_number: { in: ['GT-2025-101', 'GT-2025-102', 'GT-2025-103', 'GT-2025-104', 'GT-2025-105'] } },
    select: { id: true, roll_number: true },
  });
  const studentByRoll = new Map(demoStudents.map((student) => [student.roll_number, student.id]));

  const dataStructuresAssignment = await prisma.assignment.create({
    data: {
      title: 'Data Structures Lab - Assignment 1',
      description: 'Implement and benchmark a priority queue using a binary heap.',
      department: 'Computer Science',
      semester: 1,
      dueDate: new Date('2026-10-15T17:00:00.000Z'),
      maxMarks: 25,
    },
  });
  const microprocessorAssignment = await prisma.assignment.create({
    data: {
      title: 'Microprocessor Mini-Project',
      description: 'Build and document a sensor interface using a microcontroller board.',
      department: 'Electronics',
      semester: 1,
      dueDate: new Date('2026-10-22T17:00:00.000Z'),
      maxMarks: 50,
    },
  });

  const seededSubmissions = [
    { assignmentId: dataStructuresAssignment.id, roll: 'GT-2025-101', status: SubmissionStatus.SUBMITTED, marks: 24, daysAgo: 2 },
    { assignmentId: dataStructuresAssignment.id, roll: 'GT-2025-104', status: SubmissionStatus.SUBMITTED, marks: 21, daysAgo: 1 },
    { assignmentId: dataStructuresAssignment.id, roll: 'GT-2025-102', status: SubmissionStatus.PENDING, marks: null, daysAgo: null },
    { assignmentId: dataStructuresAssignment.id, roll: 'GT-2025-103', status: SubmissionStatus.PENDING, marks: null, daysAgo: null },
    { assignmentId: microprocessorAssignment.id, roll: 'GT-2025-105', status: SubmissionStatus.GRADED, marks: 46, daysAgo: 4 },
    { assignmentId: microprocessorAssignment.id, roll: 'GT-2025-102', status: SubmissionStatus.PENDING, marks: null, daysAgo: null },
  ];

  await prisma.submission.createMany({
    data: seededSubmissions.map((submission) => ({
      assignmentId: submission.assignmentId,
      studentId: studentByRoll.get(submission.roll)!,
      status: submission.status,
      obtainedMarks: submission.marks,
      submittedAt: submission.daysAgo === null ? null : new Date(Date.now() - submission.daysAgo * 24 * 60 * 60 * 1000),
      feedback: submission.status === SubmissionStatus.GRADED ? 'Strong implementation and clear documentation.' : null,
    })),
  });
  console.info('Seeded 2 demo assignments with submission tracking records.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seeding failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
