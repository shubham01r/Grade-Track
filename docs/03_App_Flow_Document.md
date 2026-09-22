# App Flow Document
## GradeTrack — Academic Management & Grade Evaluation System

This document describes every user-facing flow in enough step-by-step detail that an AI coding agent can wire up routes, forms, and state transitions without guessing.

---

## 1. High-Level Flow

```
[Login] → [Dashboard]
             │
             ├──► Student List ──► Student Profile ──► Add/Edit Semester
             │                                            │
             │                                            ├─ Attendance Entry (gate check)
             │                                            ├─ Subject/Marks Entry (validated)
             │                                            └─ Run Evaluation ──► Report Card
             │
             ├──► Leaderboard (batch ranking)
             │
             ├──► Export Center (CSV)
             │
             └──► Settings (grade scale, thresholds, scholarship rules)
```

---

## 2. Flow 1 — Login (MVP: single Admin role)

1. User lands on `/login`.
2. Enters email + password.
3. Backend validates credentials → returns JWT.
4. Frontend stores token (in memory / httpOnly cookie — not localStorage, per security best practice) and redirects to `/dashboard`.
5. **Error path:** wrong credentials → inline error "Invalid email or password," no field-specific hint (avoid leaking which field was wrong).

---

## 3. Flow 2 — Register a Student

**Entry point:** Dashboard → "Add Student" button, or Student List → "+ New Student".

1. Form fields: Roll Number, Full Name, Department (dropdown), Degree Type (UG/PG toggle), Admission Year/Batch.
2. On submit:
   - Client-side: required-field + format checks (instant feedback).
   - Server-side: uniqueness check on Roll Number.
3. **Success:** toast confirmation → redirect to the new Student Profile page.
4. **Error — duplicate roll number:** inline error under the Roll Number field: "This roll number is already registered." Form is not cleared; user can correct and resubmit.

---

## 4. Flow 3 — Attendance Entry (Gatekeeper)

**Entry point:** Student Profile → "Add Semester" or an existing semester → "Edit Attendance".

1. Form fields: Semester Number, Academic Year, Total Lectures, Attended Lectures.
2. On submit, backend computes `attendance_percentage = attended / total * 100`.
3. **Branch:**
   - If `attendance_percentage ≥ threshold` (default 75%, from Settings): semester status = **Eligible**. User proceeds to marks entry.
   - If `attendance_percentage < threshold`: semester status = **Debarred — Hall Ticket Withheld**. A prominent red banner appears on the semester view. Marks can still be entered for record-keeping, but the **"Run Evaluation"** action is disabled and shows a tooltip explaining why.
4. This status is re-checked live if attendance figures are ever edited later (e.g., a correction is made) — the gate is not a one-time check.

---

## 5. Flow 4 — Subject & Marks Entry

**Entry point:** within an eligible (or debarred, for record-keeping) semester → "Add Subject".

1. Form fields: Subject Code, Subject Name, Type (Theory / Lab / Thesis / Presentation), Credits (pre-filled default: Theory=4, Lab=2, editable), Theory Marks Obtained (0–100), Practical Marks Obtained (0–100, only shown if subject has a practical component).
2. **Validation on submit (client + server):**
   - Marks < 0 or > 100 → rejected with inline error: "Marks must be between 0 and 100." Field is highlighted; value is **not** saved, and the user must correct it before continuing — no silent clamping.
   - Credits must be > 0.
3. Repeat for each subject in the semester.
4. Subjects list shows a running table; each row editable/deletable until the semester is evaluated (evaluated semesters can still be edited, but doing so should visibly flag the report as "recalculated" — see Flow 5).

---

## 6. Flow 5 — Run Evaluation

**Entry point:** Semester view → "Run Evaluation" button (disabled if debarred).

1. Backend selects grading strategy by `degree_type` (UG: 40% pass / PG: 50% pass + thesis/presentation weighting).
2. For each subject: map marks → grade letter + grade point (see grade scale table in PRD/Backend Schema).
3. Flag any subject below the degree's pass threshold as a **backlog** ("Arrear / Remedial Required") — independent of the letter grade shown.
4. Compute **SGPA** for the semester: Σ(credits × grade point) / Σ(credits).
5. Recompute **CGPA**: credit-weighted average of SGPA across all completed (non-debarred) semesters for that student.
6. Recompute scholarship/probation status from the new CGPA (see PRD Section 6/F7 rules).
7. Redirect to the **Report Card** view for that student, showing the freshly computed results.
8. **Edge case — editing after evaluation:** if marks are edited post-evaluation, the semester is marked "Needs Re-evaluation" until "Run Evaluation" is triggered again; stale SGPA/CGPA is visually flagged (e.g., a small "outdated" badge) rather than silently left wrong.

---

## 7. Flow 6 — Report Card View

**Entry point:** Student Profile → "View Report Card", or automatically after Flow 5.

Displays, per student:
- Header: Roll Number, Name, Department, Degree Type, current CGPA, scholarship/probation badge.
- Per-semester breakdown: subject table (code, name, credits, marks, grade, grade point), SGPA, Debarred flag if applicable.
- Aggregate backlog list across all semesters.
- "Export this report" (CSV) and "Export batch" (link to Export Center) actions.

---

## 8. Flow 7 — Leaderboard

**Entry point:** main nav → "Leaderboard".

1. Filters: Department, Degree Type, Batch/Admission Year (all optional, default = everyone).
2. Backend query: all students in scope with a valid CGPA (i.e., not fully debarred with zero evaluated semesters), sorted by CGPA descending.
3. **Tie-breaking (assumption, confirm/adjust if needed):** ties broken by fewer active backlogs, then alphabetically by name.
4. Debarred students (no valid SGPA yet) are shown in a separate "Not Yet Ranked" section rather than silently omitted, so staff know why they're missing.
5. Rank badges (1/2/3) visually distinguished (see UI/UX Design Brief).

---

## 9. Flow 8 — Export Center

**Entry point:** main nav → "Export".

1. Select scope: single student, or batch filter (department/degree/year).
2. Click "Export CSV" → backend streams a CSV with one row per student per semester (roll number, name, semester, SGPA, CGPA, backlog count, scholarship status, debarred flag).
3. Browser downloads the file directly — no email/queue step in MVP.

---

## 10. Flow 9 — Settings (Admin config)

**Entry point:** main nav → "Settings".

1. **Attendance threshold:** numeric input, default 75%.
2. **Grade scale table:** editable rows (marks range → letter → grade point) — pre-seeded with the table from the PRD.
3. **Scholarship rules:** editable CGPA thresholds and labels, plus the "no active backlog" toggle for scholarship eligibility.
4. Changes here apply to **future** evaluations only, not retroactively — re-running evaluation on an old semester after a rule change will pick up the new rule, which is expected/desired behavior, but should show a warning: "This will recalculate results using current settings."

---

## 11. Global Error / Empty States

| Situation | Behavior |
|---|---|
| No students yet | Dashboard shows an empty-state illustration + "Add your first student" CTA |
| No semesters for a student | Profile shows "No academic records yet" + "Add Semester" CTA |
| Network/API failure | Toast: "Something went wrong — please try again," with a retry action where feasible; never a silent failure |
| Attempting to evaluate a debarred semester | Button is disabled with tooltip, not a dead click that does nothing |
| Marks entry with invalid number | Inline field error, form retains all other entered values |
