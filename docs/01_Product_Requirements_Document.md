# Product Requirements Document (PRD)
## GradeTrack — Academic Management & Grade Evaluation System

> Working name "GradeTrack" is a placeholder — rename freely. This document is written for an AI coding agent (Cursor, Claude Code, Lovable, Bolt, Replit) to build from directly.

---

## 1. Problem Statement

Colleges and departments that still calculate SGPA/CGPA, attendance eligibility, backlogs, and scholarship eligibility by hand (in Excel or on paper) run into three recurring problems:

1. **Human calculation error** in weighted GPA formulas, especially when UG and PG students are graded under different rules.
2. **Inconsistent policy enforcement** — e.g. a student under 75% attendance still getting graded because someone forgot to check.
3. **No single source of truth** for a student's academic health (current backlogs, rank in batch, scholarship eligibility) — this data lives scattered across spreadsheets.

GradeTrack automates the full pipeline: register student → validate attendance → enter marks → auto-calculate grades/SGPA/CGPA → flag backlogs & scholarships → rank the batch → export a clean report.

---

## 2. Goals & Objectives

- Eliminate manual GPA calculation errors by centralizing the grading formula in one tested engine.
- Enforce institutional policy automatically (attendance gate, UG/PG pass thresholds) rather than relying on staff memory.
- Give faculty/admin a single dashboard to see batch-wide academic health (ranks, backlogs, scholarship candidates, debarred students).
- Produce exportable, shareable report cards and consolidated batch sheets (CSV) without manual re-typing.

## 3. Target Users

| Persona | Description | Primary Needs |
|---|---|---|
| **Faculty / Exam Cell Admin** (primary user, MVP) | Enters attendance & marks, manages the student roster, generates reports | Fast data entry, strong validation (can't submit bad data), instant report generation |
| **Department Head / Dean** (secondary, MVP read-only) | Reviews batch rankings, scholarship lists, backlog counts | Leaderboards, filters by department/batch, export |
| **Student** (out of scope for MVP, noted as Phase 2) | Would view their own report card | Read-only personal report view |

**Assumption:** MVP ships with a single "Admin/Faculty" role that can do everything (no granular permission system). Student self-service login is explicitly deferred to Phase 2 — see Section 8.

---

## 4. Assumptions & Scope Decisions

Stated explicitly since the source spec described a Java desktop app but named web-app AI tools:

1. **Platform:** Responsive web application, not a native desktop app. Usable on laptop/tablet by exam-cell staff.
2. **Single institution, single deployment.** No multi-tenant/multi-college support in MVP.
3. **Single admin role** for MVP — no student portal, no login-based multi-role system yet (see Phase 2).
4. **Grade scale gaps filled in.** The source spec only defined brackets for 90–100 down to 60–69. The missing 0–59 range is filled using a standard 10-point scale (see Section 6 and the Backend Schema doc for the full table) — flagged as an assumption, editable by admin in Settings.
5. **Credits are configurable per subject**, not hardcoded to Theory=4/Lab=2 — those are just the *defaults* when adding a subject.
6. **Attendance threshold (75%) is configurable** in Settings, not hardcoded — 75% is the default.
7. **Scholarship rule refinement:** the source spec ties scholarship/Dean's List purely to CGPA. This PRD adds one sensible guardrail — a student with an **active backlog cannot be marked scholarship-eligible even if CGPA ≥ 9.0** — flagged as an assumption; toggle-able in Settings.
8. **Ranking cohort:** batch = same Department + Degree Type + Admission Year. Debarred students (attendance-blocked) are excluded from ranking since they have no valid SGPA for that semester.
9. **Persistence:** replaces the original spec's binary file serialization with a proper relational database (see Backend Schema doc) — this is what makes CSV export, multi-user access, and hosting on Lovable/Bolt/Replit possible.

---

## 5. Core Features (MVP)

### F1 — Student Profile Management
- Register a student: Roll Number (unique), Full Name, Department, Degree Type (UG/PG), Admission Year/Batch.
- Edit / deactivate a student record.
- Search/filter student list by roll number, name, department, degree type, batch.

### F2 — Attendance Gatekeeper
- Per semester, record Total Lectures and Attended Lectures.
- System computes attendance % automatically.
- If attendance % < threshold (default 75%): semester is flagged **"Debarred — Hall Ticket Withheld"**, and grade evaluation for that semester is blocked (marks can still be recorded for the file, but no SGPA is generated and the student is excluded from ranking/scholarship for that semester).

### F3 — Marks Entry with Validation
- Add subjects to a semester: Subject Code, Subject Name, Type (Theory/Lab/Thesis/Presentation), Credits, Theory Marks, Practical Marks (where applicable).
- Hard validation: marks must be `0–100`; out-of-range or negative input is rejected with a clear inline error before it can be saved — never silently clamped.
- Theory and practical components are tracked and stored separately, then combined into a total per subject.

### F4 — Dual-Mode Evaluation Engine (UG vs PG)
- Two grading modes sharing one calculation engine but different pass thresholds and rules:
  - **UG:** pass mark 40%.
  - **PG:** pass mark 50%, plus optional Thesis/Presentation components with their own weighting.
- Marks → Grade Point mapping (10-point scale, see Backend Schema doc for full table).
- **SGPA** = Σ(Subject Credits × Grade Point) / Σ(Subject Credits), computed per semester.
- **CGPA** = credit-weighted average of SGPA across all completed (non-debarred) semesters.

### F5 — Backlog Detection
- Any subject where the student scores below their degree type's pass threshold is flagged as a **backlog** ("Arrear / Remedial Required").
- Student profile shows an aggregate active-backlog count and list.

### F6 — Leaderboard / Ranking
- Rank students within a batch (Department + Degree Type + Admission Year) by CGPA, descending.
- Ties broken by... (see assumption below).
- Filterable by department, degree type, batch/year.

### F7 — Scholarship & Honors Engine
- CGPA ≥ 9.0 (and no active backlog) → "Eligible — 100% Academic Merit Scholarship & Dean's List"
- CGPA ≥ 8.0 (and < 9.0) → "Eligible — Merit Honor Roll"
- CGPA < 5.0 → "Academic Probation — Counseling Required"
- Otherwise → "Good Standing"

### F8 — Report Card & Export
- Per-student report card: all semesters, per-subject grades, SGPA per semester, CGPA, backlog list, scholarship status, debarred flags.
- Batch-level consolidated export to **CSV** (opens cleanly in Excel/Sheets).

---

## 6. Grade Scale (Reference)

| Marks Range | Letter Grade | Grade Point |
|---|---|---|
| 90–100 | O | 10 |
| 80–89 | A+ | 9 |
| 70–79 | A | 8 |
| 60–69 | B | 7 |
| 50–59 | C | 6 |
| 40–49 | D | 5 |
| 0–39 | F | 0 |

*Rows 50–59, 40–49, 0–39 are filled in as a reasonable default (assumption #4) — the original spec did not define them.* Pass/fail status is determined **separately**, per degree type, using the thresholds in F4 (UG ≥40%, PG ≥50%) — so a PG student scoring 45% gets letter grade "D" but is still marked **backlog/fail**, since 45% is below the PG threshold.

---

## 7. User Stories

1. As an admin, I want to register a new student with roll number and degree type, so their records can be tracked from day one.
2. As an admin, I want the system to block grading automatically when attendance is below policy, so I don't accidentally issue a hall ticket to an ineligible student.
3. As an admin, I want marks entry to reject invalid numbers immediately, so bad data never reaches a report card.
4. As an admin, I want SGPA/CGPA calculated automatically per the correct UG or PG rule, so I never have to compute it by hand.
5. As a dept. head, I want to see the batch ranked by CGPA, so I can quickly identify top performers and at-risk students.
6. As an admin, I want to export the whole batch's results to CSV in one click, so I can share it with the registrar.
7. As an admin, I want to see which students have active backlogs, so I can route them to remedial classes.

## 8. Out of Scope (v1)

- Student self-service login/portal (Phase 2).
- Multi-institution / multi-tenant support.
- Fine-grained role/permission system (multiple admin roles).
- Automated PDF report card generation (CSV export only in MVP; PDF listed as Phase 2 in the Implementation Plan).
- Email/SMS notifications to students.
- Attendance import from biometric/RFID systems (manual entry only in MVP).

## 9. Success Metrics

- Zero calculation discrepancies between the app's SGPA/CGPA and manual spot-checks on a sample batch.
- Time to generate a full batch report card drops from hours (manual) to minutes.
- 100% of debarred (sub-75%-attendance) students are correctly blocked from grade evaluation — no false negatives.

## 10. Future Enhancements (Phase 2+)

- Student login portal (read-only report card view).
- PDF report card generation with institution letterhead.
- Configurable multi-role permissions (Admin / Faculty / Read-only Viewer).
- Attendance/marks bulk import via CSV/Excel upload.
- Semester-over-semester trend charts per student.
- Multi-department / multi-institution support.
