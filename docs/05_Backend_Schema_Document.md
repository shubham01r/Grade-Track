# Backend Schema Document
## GradeTrack — Academic Management & Grade Evaluation System

Database: **PostgreSQL**. Schema shown in Prisma syntax (translate directly to raw SQL or Supabase table definitions if using Path B from the TRD — the shape is identical either way).

---

## 1. Entity Relationship Overview

```
Student (1) ──< Semester (many) ──< Subject (many)

GradeScaleRule        (config table, no FK — global lookup)
ScholarshipRule        (config table, no FK — global lookup)
SystemSettings          (single-row config: attendance threshold, etc.)
AdminUser               (auth)
```

- One **Student** has many **Semesters**.
- One **Semester** has many **Subjects**.
- SGPA is stored on `Semester` (computed field, cached after evaluation).
- CGPA is stored on `Student` (computed field, cached after each evaluation run, recalculated as a weighted average of all non-debarred semesters).

---

## 2. Tables

### 2.1 `AdminUser`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| email | String | unique, not null |
| password_hash | String | not null |
| created_at | Timestamp | default now() |

### 2.2 `Student`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| roll_number | String | **unique, not null, indexed** (fast lookup) |
| full_name | String | not null |
| department | String | not null |
| degree_type | Enum(`UG`, `PG`) | not null |
| admission_year | Int | not null (used for batch grouping) |
| cgpa | Decimal(4,2) | nullable, cached, recomputed on each evaluation |
| scholarship_status | Enum(`SCHOLARSHIP`, `HONOR_ROLL`, `GOOD_STANDING`, `PROBATION`) | default `GOOD_STANDING`, cached |
| created_at | Timestamp | default now() |
| updated_at | Timestamp | auto-update |

**Indexes:** unique index on `roll_number`; composite index on (`department`, `degree_type`, `admission_year`) for fast leaderboard/batch queries.

### 2.3 `Semester`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| student_id | UUID | FK → Student.id, not null, on delete cascade |
| semester_number | Int | not null |
| academic_year | String | not null (e.g. "2025-26") |
| total_lectures | Int | not null, ≥ 0 |
| attended_lectures | Int | not null, ≥ 0, **must be ≤ total_lectures** (app-level + DB check constraint) |
| attendance_percentage | Decimal(5,2) | computed = attended / total * 100 |
| is_debarred | Boolean | computed = attendance_percentage < threshold |
| sgpa | Decimal(4,2) | nullable — null until "Run Evaluation" has been executed |
| evaluation_status | Enum(`NOT_EVALUATED`, `EVALUATED`, `NEEDS_REEVALUATION`) | default `NOT_EVALUATED` |
| created_at / updated_at | Timestamp | |

**Constraint:** `UNIQUE(student_id, semester_number)` — a student can't have two "Semester 3" records.

### 2.4 `Subject`
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| semester_id | UUID | FK → Semester.id, not null, on delete cascade |
| subject_code | String | not null |
| subject_name | String | not null |
| subject_type | Enum(`THEORY`, `LAB`, `THESIS`, `PRESENTATION`) | not null |
| credits | Int | not null, **check: credits > 0** |
| theory_max_marks | Int | default 100 |
| theory_marks_obtained | Int | nullable, **check: 0 ≤ value ≤ theory_max_marks** |
| practical_max_marks | Int | nullable |
| practical_marks_obtained | Int | nullable, **check: 0 ≤ value ≤ practical_max_marks** |
| total_marks_obtained | Decimal(5,2) | computed = theory + practical (weighted, see §4) |
| grade_letter | String | computed, nullable until evaluated |
| grade_point | Int | computed, nullable until evaluated |
| is_backlog | Boolean | computed = total % below the student's degree-type pass threshold |

### 2.5 `GradeScaleRule` (seed data, admin-editable)
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| marks_min | Int | not null |
| marks_max | Int | not null |
| grade_letter | String | not null |
| grade_point | Int | not null |

Seed rows (default, matches PRD §6):
```
90-100 → O  → 10
80-89  → A+ → 9
70-79  → A  → 8
60-69  → B  → 7
50-59  → C  → 6
40-49  → D  → 5
0-39   → F  → 0
```

### 2.6 `ScholarshipRule` (seed data, admin-editable)
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| min_cgpa | Decimal(4,2) | not null |
| max_cgpa | Decimal(4,2) | nullable (null = no upper bound) |
| label | String | not null |
| status_code | Enum(`SCHOLARSHIP`, `HONOR_ROLL`, `GOOD_STANDING`, `PROBATION`) | not null |
| requires_no_backlog | Boolean | default true |

Seed rows:
```
≥9.0        → "100% Academic Merit Scholarship & Dean's List" → SCHOLARSHIP  → requires_no_backlog=true
8.0–8.99    → "Merit Honor Roll"                                 → HONOR_ROLL   → requires_no_backlog=false
<5.0         → "Academic Probation (Counseling Required)"       → PROBATION    → requires_no_backlog=false
(else)        → "Good Standing"                                     → GOOD_STANDING
```

### 2.7 `SystemSettings` (single row)
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK (single row, seeded once) |
| attendance_threshold_percent | Decimal(5,2) | default 75.00 |

---

## 3. API Endpoints (REST, base path `/api/v1`)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | Admin login → JWT |
| POST | `/students` | Register student |
| GET | `/students?dept=&degree=&batch=&search=` | List/search/filter students |
| GET | `/students/:id` | Student profile incl. semesters |
| PUT | `/students/:id` | Edit student |
| DELETE | `/students/:id` | Remove student |
| POST | `/students/:id/semesters` | Add semester (incl. attendance) |
| PUT | `/semesters/:id/attendance` | Update attendance figures |
| POST | `/semesters/:id/subjects` | Add subject + marks |
| PUT | `/subjects/:id` | Edit subject/marks |
| DELETE | `/subjects/:id` | Remove subject |
| POST | `/semesters/:id/evaluate` | **Run evaluation engine** — computes grades, SGPA, updates student CGPA & scholarship status |
| GET | `/students/:id/report` | Full report card data |
| GET | `/leaderboard?dept=&degree=&batch=` | Ranked list by CGPA |
| GET | `/export/csv?dept=&degree=&batch=&studentId=` | Stream CSV export |
| GET/PUT | `/settings/attendance-threshold` | Read/update threshold |
| GET/PUT | `/settings/grade-scale` | Read/update grade scale rows |
| GET/PUT | `/settings/scholarship-rules` | Read/update scholarship rules |

All POST/PUT/DELETE endpoints require a valid admin JWT (`Authorization: Bearer <token>`).

---

## 4. Business Logic Reference

### 4.1 Total marks per subject
```
total_marks_obtained =
  if practical_max_marks exists:
      theory_marks_obtained + practical_marks_obtained   (both already on 0–100 scale for their component)
  else:
      theory_marks_obtained
```
*(If your institution instead wants theory/practical weighted as percentages of a combined 100, adjust this formula in Settings/config — flagged as an implementation detail to confirm with actual institutional policy.)*

### 4.2 Grade lookup
```
grade = first GradeScaleRule where marks_min ≤ total_marks_obtained ≤ marks_max
```

### 4.3 Pass/backlog determination
```
pass_threshold = 40 if student.degree_type == 'UG' else 50
is_backlog = total_marks_obtained < pass_threshold
```
(Independent of which letter grade bracket the marks fall into — see PRD §6 note.)

### 4.4 SGPA
```
SGPA = Σ(subject.credits × subject.grade_point) / Σ(subject.credits)   — for all subjects in that semester
```

### 4.5 CGPA
```
CGPA = Σ(semester.sgpa × Σcredits_in_that_semester) / Σ(all credits across all non-debarred, evaluated semesters)
```

### 4.6 Debarred check
```
is_debarred = (attended_lectures / total_lectures * 100) < SystemSettings.attendance_threshold_percent
```

### 4.7 Scholarship/probation status
```
Evaluate ScholarshipRule rows in descending min_cgpa order; pick first match where:
  student.cgpa is within [min_cgpa, max_cgpa]
  AND (requires_no_backlog == false OR student has zero active backlogs)
```

---

## 5. Validation Rules Summary

| Field | Rule |
|---|---|
| `roll_number` | Required, unique, non-empty string |
| `theory_marks_obtained` / `practical_marks_obtained` | Required, integer, `0 ≤ x ≤ max_marks` |
| `credits` | Required, integer, `> 0` |
| `attended_lectures` | Required, integer, `≥ 0`, `≤ total_lectures` |
| `total_lectures` | Required, integer, `> 0` |
| `degree_type` | Enum `UG` or `PG` only |
