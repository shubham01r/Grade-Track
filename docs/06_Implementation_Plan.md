# Implementation Plan
## GradeTrack — Academic Management & Grade Evaluation System

A phased build order for an AI coding agent to follow. Each phase has a clear "done" checklist so progress can be verified before moving on — don't let the agent skip ahead to UI polish before the evaluation engine is tested.

---

## Phase 0 — Project Setup
- [ ] Scaffold repo per the folder structure in the TRD (`frontend/`, `backend/`, `prisma/`).
- [ ] Set up PostgreSQL (local Docker, or hosted Supabase/Neon/Railway — pick per TRD Path A/B decision).
- [ ] Initialize Prisma with the schema from the Backend Schema Document; run first migration.
- [ ] Seed `GradeScaleRule`, `ScholarshipRule`, and default `SystemSettings` rows.
- [ ] Create one `AdminUser` seed account for local testing.

**Done when:** `npx prisma studio` shows all tables correctly created and seeded.

---

## Phase 1 — Evaluation Engine (build and test this BEFORE any UI)
- [ ] Implement pure functions: `mapMarksToGrade()`, `isBacklog()`, `calculateSGPA()`, `calculateCGPA()`, `calculateAttendanceGate()`, `calculateScholarshipStatus()`.
- [ ] Write unit tests covering boundary values: marks = 39/40/49/50, attendance = 74.9%/75%, CGPA = 4.99/5.0/7.99/8.0/8.99/9.0.
- [ ] Confirm UG vs PG threshold logic (40% vs 50%) with test cases for both degree types.

**Done when:** all unit tests pass and boundary cases are explicitly covered — this is the highest-risk part of the whole app; do not proceed until it's solid.

---

## Phase 2 — Core Backend API (CRUD)
- [ ] Auth: `/auth/login` with JWT issuance.
- [ ] Students: create, list/filter/search, get, update, delete.
- [ ] Semesters: create (with attendance), update attendance.
- [ ] Subjects: create/update/delete with Zod validation (0–100 marks, credits > 0).
- [ ] Wire the Phase 1 evaluation engine into `POST /semesters/:id/evaluate`.
- [ ] `/students/:id/report` endpoint assembling the full report card payload.
- [ ] `/leaderboard` endpoint with department/degree/batch filters and CGPA sort.
- [ ] `/export/csv` streaming endpoint.
- [ ] Settings endpoints (attendance threshold, grade scale, scholarship rules).

**Done when:** every endpoint in the Backend Schema Document works via a REST client (Postman/Thunder Client) with both valid and invalid payloads tested.

---

## Phase 3 — Frontend Shell & Auth
- [ ] App shell: sidebar nav + routing (React Router) per the screens in the UI/UX Design Brief.
- [ ] Login page wired to `/auth/login`; protected-route wrapper redirecting unauthenticated users.
- [ ] Global API client (TanStack Query) with consistent error-toast handling.

---

## Phase 4 — Student & Semester Management UI
- [ ] Student List (search/filter/table) — Flow 2/3 from App Flow doc.
- [ ] Add/Edit Student form with duplicate-roll-number handling.
- [ ] Student Profile page (semester list, CGPA, status badges).
- [ ] Semester Detail page: attendance form with live gate-check banner, subject/marks entry table with inline validation errors.
- [ ] "Run Evaluation" button wired to the evaluate endpoint, disabled when debarred.

**Done when:** a full manual walkthrough — register student → enter attendance below and above threshold → enter marks including an intentionally invalid one → run evaluation — behaves exactly as described in the App Flow Document.

---

## Phase 5 — Reporting & Analytics UI
- [ ] Report Card view (per student).
- [ ] Leaderboard view with filters and the "Not Yet Ranked" section for debarred students.
- [ ] Dashboard summary cards (total students, active backlogs, debarred count, scholarship-eligible count).

---

## Phase 6 — Export & Settings UI
- [ ] Export Center screen, wired to the CSV endpoint, scoped by filters.
- [ ] Settings screen: attendance threshold, grade scale table editor, scholarship rule editor.
- [ ] Confirm a settings change (e.g. lowering the attendance threshold) correctly affects a *re-run* evaluation, per App Flow §10.

---

## Phase 7 — Testing, Polish, Deployment
- [ ] Integration test pass: invalid marks/attendance rejected end-to-end (UI → API → DB never receives bad data).
- [ ] Manual QA checklist:
  - Register a UG student, fail one subject → confirm backlog flag and correct pass threshold (40%).
  - Register a PG student with the same marks → confirm it's flagged backlog under the 50% threshold even if UG wouldn't be.
  - Push a student's attendance below 75% → confirm evaluation is blocked and the debarred banner shows.
  - Push a student's CGPA to exactly 9.0 with zero backlogs → confirm Scholarship + Dean's List status.
  - Give a 9.2 CGPA student one active backlog → confirm scholarship is correctly withheld (per assumption in PRD §4.7).
  - Export CSV for a filtered batch → open in Excel, confirm columns and values match the UI.
- [ ] Accessibility pass: keyboard navigation through the marks-entry form; color-blind check on status badges (text/icon present, not color-only).
- [ ] Deploy: frontend → Vercel/Netlify; backend+DB → Railway/Render, or full stack → Supabase, per the TRD's chosen path.
- [ ] Set production environment variables (`DATABASE_URL`, `JWT_SECRET`) securely — never commit `.env`.

---

## Suggested Folder Structure

```
/gradetrack
├── frontend/
│   ├── src/
│   │   ├── pages/            # Login, Dashboard, StudentList, StudentProfile, SemesterDetail, ReportCard, Leaderboard, Export, Settings
│   │   ├── components/       # shared UI: StatusBadge, DataTable, FormField, etc.
│   │   ├── api/               # TanStack Query hooks per resource
│   │   └── types/             # shared TS types (mirror backend Zod schemas)
├── backend/
│   ├── src/
│   │   ├── routes/            # one file per resource (students, semesters, subjects, leaderboard, export, settings, auth)
│   │   ├── services/
│   │   │   └── evaluation/    # PHASE 1 pure functions live here — kept isolated & fully unit-tested
│   │   ├── middleware/        # auth guard, error handler
│   │   └── validation/         # Zod schemas, shared with frontend via a shared types package if feasible
├── prisma/
│   └── schema.prisma
└── README.md
```

---

## How to Feed These Documents to an AI Coding Tool

1. Drop all six files into the repo root (or a `/docs` folder) before generating any code.
2. Start with a prompt like: *"Read `02_Technical_Requirements_Document.md` and `05_Backend_Schema_Document.md` and scaffold the Prisma schema and Express project structure — do not write UI code yet."*
3. Move to Phase 1 (evaluation engine + tests) as its own prompt/session before touching the frontend — this is the step most worth reviewing by hand before continuing.
4. For Lovable/Bolt specifically: paste the PRD and UI/UX Design Brief first to get the screen scaffolding right, then paste the Backend Schema Document to get the Supabase tables right.
