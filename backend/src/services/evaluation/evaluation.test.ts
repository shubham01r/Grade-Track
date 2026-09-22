import { describe, expect, it } from 'vitest';
import { calculateAttendanceGate, calculateCGPA, calculateScholarshipStatus, calculateSGPA, isBacklog, mapMarksToGrade } from './evaluation.js';

describe('mapMarksToGrade', () => {
  it('maps marks below 40 to F', () => {
    expect(mapMarksToGrade(39)).toEqual({ grade_letter: 'F', grade_point: 0 });
  });

  it('maps marks 40 to D', () => {
    expect(mapMarksToGrade(40)).toEqual({ grade_letter: 'D', grade_point: 5 });
  });

  it('maps marks 49 to D and 50 to C', () => {
    expect(mapMarksToGrade(49)).toEqual({ grade_letter: 'D', grade_point: 5 });
    expect(mapMarksToGrade(50)).toEqual({ grade_letter: 'C', grade_point: 6 });
  });

  it('maps 89 to A+ and 90 to O', () => {
    expect(mapMarksToGrade(89)).toEqual({ grade_letter: 'A+', grade_point: 9 });
    expect(mapMarksToGrade(90)).toEqual({ grade_letter: 'O', grade_point: 10 });
  });
});

describe('isBacklog', () => {
  it('treats marks below 40 as backlog for UG', () => {
    expect(isBacklog(39, 'UG')).toBe(true);
    expect(isBacklog(40, 'UG')).toBe(false);
  });

  it('treats marks below 50 as backlog for PG', () => {
    expect(isBacklog(49, 'PG')).toBe(true);
    expect(isBacklog(50, 'PG')).toBe(false);
  });
});

describe('calculateSGPA', () => {
  it('returns weighted average across all subjects', () => {
    const sgpa = calculateSGPA([
      { credits: 4, grade_point: 10, total_marks_obtained: 95 },
      { credits: 3, grade_point: 9, total_marks_obtained: 89 },
      { credits: 2, grade_point: 8, total_marks_obtained: 78 },
    ]);

    expect(sgpa).toBe(9.22);
  });

  it('returns zero for no subjects', () => {
    expect(calculateSGPA([])).toBe(0);
  });
});

describe('calculateCGPA', () => {
  it('calculates weighted CGPA from semester records', () => {
    const cgpa = calculateCGPA([
      { sgpa: 9.2, credits: 20 },
      { sgpa: 8.8, credits: 18 },
    ]);

    expect(cgpa).toBe(9.01);
  });

  it('handles exact threshold values around 9.0', () => {
    expect(calculateCGPA([{ sgpa: 9.0, credits: 20 }])).toBe(9);
    expect(calculateCGPA([{ sgpa: 8.99, credits: 20 }])).toBe(8.99);
  });
});

describe('calculateAttendanceGate', () => {
  it('blocks attendance below the configured threshold', () => {
    expect(calculateAttendanceGate(74, 100, 75)).toBe(false);
    expect(calculateAttendanceGate(75, 100, 75)).toBe(true);
  });

  it('handles fractional percentages around threshold', () => {
    expect(calculateAttendanceGate(74, 99, 75)).toBe(false);
    expect(calculateAttendanceGate(74.9, 100, 75)).toBe(false);
    expect(calculateAttendanceGate(75, 100, 75)).toBe(true);
  });
});

describe('calculateScholarshipStatus', () => {
  it('awards scholarship at 9.0 and higher with no backlog', () => {
    expect(calculateScholarshipStatus(9.0, false)).toBe('SCHOLARSHIP');
  });

  it('withholds scholarship when a backlog is active despite CGPA above 9.0', () => {
    expect(calculateScholarshipStatus(9.2, true)).toBe('GOOD_STANDING');
  });

  it('returns honor roll for 8.99 with no backlog', () => {
    expect(calculateScholarshipStatus(8.99, false)).toBe('HONOR_ROLL');
  });

  it('returns probation for low CGPA', () => {
    expect(calculateScholarshipStatus(4.99, false)).toBe('PROBATION');
  });
});
