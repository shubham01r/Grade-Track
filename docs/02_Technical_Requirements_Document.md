# Technical Requirements Document (TRD)
## GradeTrack — Academic Management & Grade Evaluation System

This document defines the technical stack, architecture, and non-functional requirements. It also maps the original spec's Java OOP concepts to their equivalents in the chosen web stack, so no business logic is lost in translation.

---

## 1. Recommended Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **React 18 + TypeScript + Vite** | Universally supported by Cursor, Lovable, Bolt, Replit; large ecosystem |
| Styling / Components | **Tailwind CSS + shadcn/ui** | Fast to build clean admin UIs; matches what Lovable/Bolt scaffold by default |
| Data fetching / cache | **TanStack Query (React Query)** | Clean async state handling, avoids manual loading/error boilerplate |
| Backend API | **Node.js + Express (TypeScript)** | Simple REST API, easy for any AI tool to extend; swap-compatible with Supabase Edge Functions if using Lovable/Bolt's default backend |
| ORM | **Prisma** | Type-safe schema-to-code, migrations are AI-tool-friendly (declarative `schema.prisma`) |
| Database | **PostgreSQL** (via Supabase, Neon, or Railway) | Relational integrity for credits/marks/GPA math; CSV export trivial from SQL |
| Validation | **Zod** (shared between frontend forms and backend API) | Single source of truth for "marks 0–100", "credits > 0", etc. |
| Auth (MVP) | **Simple email/password admin auth (JWT)**, or Supabase Auth if using Supabase | MVP only needs one protected admin role |
| CSV export | **`csv-stringify`** (Node) or `Papaparse` client-side | Matches original spec's "Export to CSV" requirement |
| Hosting | Frontend: Vercel/Netlify · Backend+DB: Railway/Render, or all-in-one on Supabase | Matches what Bolt/Lovable/Replit deploy to out of the box |

**Two valid build paths — pick one and stay consistent:**
- **Path A (custom API):** React frontend ↔ Express REST API ↔ PostgreSQL/Prisma. Best for Cursor/Replit/Claude Code.
- **Path B (Supabase-first):** React frontend ↔ Supabase client SDK ↔ Postgres directly (with Row Level Security) + Supabase Edge Functions for the evaluation engine. Best for Lovable/Bolt, which scaffold Supabase by default.

Both paths use the **identical database schema** (see Backend Schema Document) and the **identical evaluation-engine logic** — only how the frontend talks to the backend changes. Tell your AI coding tool which path you're using before it starts scaffolding.

---

## 2. Architecture Overview

```
┌─────────────────────┐        HTTPS/JSON        ┌──────────────────────┐
│   React Frontend     │ ───────────────────────▶ │   REST API (Express)  │
│  (Vite, TS, Tailwind)│ ◀─────────────────────── │   or Supabase Edge Fn │
└─────────────────────┘                           └───────────┬──────────┘
                                                                │ Prisma / SQL
                                                                ▼
                                                     ┌──────────────────────┐
                                                     │   PostgreSQL          │
                                                     │  (students, semesters,│
                                                     │   subjects, config)   │
                                                     └──────────────────────┘
```

- The **Evaluation Engine** (grade/SGPA/CGPA/backlog/scholarship calculation) lives entirely on the **backend**, never trusted to the client — this guarantees one authoritative calculation, matching the original spec's intent of removing "human error."
- The frontend never computes a grade itself; it only sends raw marks/attendance and renders whatever the backend returns.

---

## 3. Java-Concept → Web-Stack Mapping

The original spec described this system in Java OOP terms. Here's how each concept translates, so the same design intent is preserved:

| Original Java Concept | Web-Stack Equivalent | Where It Lives |
|---|---|---|
| `interface GradeCalculator` with `calculateSGPA()`, `calculateGrade()` | A **Strategy Pattern**: `getGradingStrategy(degreeType)` returns a config object `{ passThreshold, extraComponents }`; one shared `calculateSGPA()` function takes the strategy as a parameter | `backend/src/services/evaluation/` |
| Runtime polymorphism (`@Override`) for UG vs PG | Two strategy objects (`ugStrategy`, `pgStrategy`) passed into the same function — behavior changes via data, not inheritance | Same evaluation service |
| Method overloading for marks input variants | TypeScript function with optional parameters / a discriminated union type (`{ type: 'single' } \| { type: 'theory-practical', theory, practical }`) | `backend/src/services/marks/` |
| Custom exceptions (`InvalidMarksException`, `LowAttendanceException`) | Typed API error responses with machine-readable `error_code` (`INVALID_MARKS`, `LOW_ATTENDANCE`) + HTTP 400/409, validated up-front by Zod schemas | `backend/src/middleware/errorHandler.ts` |
| `HashMap<String, Student>` for O(1) roll-number lookup | Unique **indexed column** `roll_number` in Postgres (B-tree index) — effectively fast lookup at DB scale, no in-memory map needed | Prisma schema `@unique` |
| `Collections.sort()` with `Comparator` for leaderboard | `ORDER BY cgpa DESC` in SQL, or `Array.prototype.sort()` with a comparator on the frontend for client-side re-sorting | `GET /leaderboard` endpoint |
| File I/O (`ObjectOutputStream`, `FileWriter`) for persistence & CSV | PostgreSQL for persistence (survives restarts, supports multi-user); `csv-stringify` for CSV export | DB + `GET /export/csv` endpoint |

---

## 4. Non-Functional Requirements

### 4.1 Validation & Data Integrity
- All marks inputs validated server-side (never trust client-side validation alone): `0 ≤ marks ≤ 100`.
- `attended_lectures ≤ total_lectures` enforced at the API level.
- `roll_number` unique constraint enforced at the database level (not just app logic).
- Every write operation that could produce an invalid academic record returns a structured error before it touches the database.

### 4.2 Error Handling
- All API errors return a consistent JSON shape:
```json
{ "error": { "code": "INVALID_MARKS", "message": "Marks must be between 0 and 100." } }
```
- Frontend surfaces these as inline field errors, not generic alerts.

### 4.3 Performance
- Roll-number lookup and leaderboard queries must use indexed columns (see Backend Schema doc) — target < 200ms for a batch of up to 2,000 students.
- Evaluation engine recalculation for one semester should be a single transactional DB write (all-or-nothing) so a report card is never left half-updated.

### 4.4 Security (MVP scope)
- Admin auth required for all write endpoints (POST/PUT/DELETE).
- Read-only report/leaderboard endpoints may be public within the institution's deployment, or also gated — decide per institution policy; default to gated in this build.
- No sensitive personal data beyond name/roll number/department is stored in MVP (no addresses, no grades-as-PII regulation compliance work is in scope here — flag to legal/compliance team if this handles real student records).

### 4.5 Consistency of the Evaluation Engine
- SGPA/CGPA/backlog/scholarship logic must be **pure functions** (same input → same output, no side effects), unit-testable in isolation from the API and database. This is the single most important piece of code in the app — treat it like a financial calculation, not a UI feature.

### 4.6 Accessibility & Responsiveness
- Data-entry forms usable on a laptop (primary) and tablet (secondary). Mobile phone support is a nice-to-have, not a requirement, given this is a staff data-entry tool.
- Standard semantic HTML, keyboard-navigable forms, sufficient color contrast for status badges (see UI/UX Design Brief).

---

## 5. Environment & Dev Setup

```
/gradetrack
├── frontend/          # React + Vite + TS
├── backend/            # Express + TS + Prisma  (skip if Path B/Supabase-only)
├── prisma/
│   └── schema.prisma   # Single source of truth for DB schema
├── .env.example         # DATABASE_URL, JWT_SECRET, etc.
└── README.md
```

- Node.js ≥ 20 LTS.
- `.env` holds `DATABASE_URL` (Postgres connection string), `JWT_SECRET`, `PORT`.
- `npx prisma migrate dev` to apply schema changes locally.

## 6. Testing Requirements

- **Unit tests (required, high priority):** the evaluation engine — grade-point mapping, SGPA formula, CGPA formula, backlog detection, scholarship rule precedence, attendance gate logic. Cover boundary values explicitly (marks = exactly 40, exactly 75% attendance, exactly CGPA 9.0, etc.).
- **Integration tests:** API endpoints for marks/attendance validation rejecting bad input (negative marks, marks > 100, attended > total).
- **Manual QA checklist:** see Implementation Plan, Phase 7.

## 7. Third-Party Libraries Summary

| Purpose | Library |
|---|---|
| Schema validation | `zod` |
| ORM | `prisma` |
| CSV export | `csv-stringify` (backend) |
| Charts (leaderboard, optional) | `recharts` |
| Date handling | `date-fns` |
| Auth tokens | `jsonwebtoken` + `bcrypt` |
