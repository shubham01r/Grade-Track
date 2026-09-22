# UI/UX Design Brief
## GradeTrack — Academic Management & Grade Evaluation System

---

## 1. Design Principles

1. **This is a data-entry and reporting tool, not a marketing site.** Prioritize density, clarity, and speed over decoration — exam-cell staff will use this daily under time pressure.
2. **Never let a bad number through silently.** Validation errors must be impossible to miss (inline, colored, positioned right at the field).
3. **Status at a glance.** Debarred / Backlog / Scholarship / Probation are the most important signals in the whole app — they need consistent, unmistakable visual treatment everywhere they appear (profile, report card, leaderboard).
4. **Trustworthy, institutional feel.** Calm, professional palette — this represents official academic records, not a consumer app.

---

## 2. Design System Basics

**Recommended base:** Tailwind CSS + shadcn/ui component library (buttons, tables, forms, dialogs, badges, toasts) — fast to assemble, consistent, and what Lovable/Bolt/Cursor scaffold well.

### Color Palette (semantic — use consistently for status)

| Status | Color | Usage |
|---|---|---|
| Eligible / Good Standing | Neutral gray / slate | Default state text |
| Pass / Eligible | Green (`emerald-600`) | Passed subject, eligible semester |
| Backlog / Fail | Amber/Orange (`amber-600`) | "Arrear / Remedial Required" tag |
| Debarred | Red (`red-600`) | "Debarred — Hall Ticket Withheld" banner |
| Scholarship / Dean's List | Gold/Indigo accent (`indigo-600` or a gold `amber-400` badge) | Top honors badge |
| Probation | Red-outline badge | "Academic Probation — Counseling Required" |

Base neutrals: white/slate-50 background, slate-900 text, slate-200 borders — standard admin-dashboard look.

### Typography
- Sans-serif system font stack (Inter, or system-ui) — readable at small sizes for dense tables.
- Clear hierarchy: page titles (bold, larger), section headers (medium), table data (regular, tabular numerals for marks/GPA columns so digits align).

### Spacing & Layout
- Standard 8px spacing scale (Tailwind default).
- Left sidebar navigation (Dashboard, Students, Leaderboard, Export, Settings) + main content area — classic admin-dashboard shell.
- Tables: sticky header row, zebra-striping optional, generous row height for scanability.

---

## 3. Screen Inventory

1. Login
2. Dashboard (overview)
3. Student List
4. Add/Edit Student (modal or page)
5. Student Profile (semesters, backlog summary, CGPA)
6. Semester Detail (attendance + subjects/marks entry)
7. Report Card (single student, printable/exportable)
8. Leaderboard
9. Export Center
10. Settings (grade scale, thresholds, scholarship rules)

---

## 4. Screen-by-Screen Breakdown

### 4.1 Login
- Centered card: email, password, "Sign in" button.
- Minimal branding, no marketing copy.

### 4.2 Dashboard
- Top summary cards: Total Students, Active Backlogs (count), Debarred This Term (count), Scholarship-Eligible (count).
- Quick actions: "Add Student", "Go to Leaderboard".
- Recent activity list (optional, nice-to-have): last 5 evaluations run.
- Empty state (no students yet): illustration + "Add your first student" CTA.

### 4.3 Student List
- Search bar (roll number / name) + filters (department, degree type, batch).
- Table columns: Roll No., Name, Department, Degree, Current CGPA, Status badges (Backlog/Debarred/Scholarship if applicable).
- Row click → Student Profile. "+ New Student" button top-right.

### 4.4 Add/Edit Student
- Simple form: Roll Number, Full Name, Department (dropdown), Degree Type (UG/PG segmented toggle), Admission Year.
- Inline validation (required fields, duplicate roll number caught on submit).

### 4.5 Student Profile
- Header block: name, roll no., department, degree type, **large CGPA display**, status badges (Scholarship/Probation/Backlog count).
- List of semesters (cards or accordion), each showing: semester number, attendance %, SGPA, Debarred flag if applicable.
- "Add Semester" button.
- Link to full Report Card view.

### 4.6 Semester Detail
- Two sections on one page (or two tabs): **Attendance** and **Subjects/Marks**.
- Attendance section: Total Lectures, Attended Lectures inputs → live-computed percentage shown next to the inputs as they type. If below threshold, a red banner appears immediately: "⚠ Below 75% attendance — this semester will be Debarred."
- Subjects section: table of added subjects with inline-editable marks; "+ Add Subject" row/button; per-row validation errors shown directly under the offending cell.
- "Run Evaluation" primary button — disabled (with tooltip) if debarred.

### 4.7 Report Card
- Clean, print-friendly layout (this is the one screen worth optimizing for printing/PDF export later).
- Institution-style header, student info block, full semester-by-semester subject/grade table, SGPA per semester, final CGPA, backlog summary, scholarship/probation badge.
- "Export CSV" button.

### 4.8 Leaderboard
- Filter bar: Department, Degree Type, Batch.
- Ranked table: Rank #, Name, Roll No., CGPA, Backlog count. Top 3 visually distinguished (medal-style badge or highlighted row).
- Separate collapsed section below: "Not Yet Ranked (Debarred / Incomplete)".

### 4.9 Export Center
- Scope selector (single student / batch filter).
- "Export CSV" button → triggers browser download.
- Brief note on what columns are included.

### 4.10 Settings
- Three clearly separated cards/sections: Attendance Threshold (single numeric input), Grade Scale (editable table), Scholarship Rules (editable thresholds + the "require no backlog" toggle).
- Save button per section, with a confirmation toast.

---

## 5. Component States to Design For

- **Loading:** skeleton rows for tables, spinner on buttons mid-submit.
- **Empty:** every list/table needs a designed empty state, not a blank screen.
- **Error:** inline field errors (red text + red border) and toast-level errors for network/server failures.
- **Disabled:** "Run Evaluation" when debarred; "Export" when no data matches the filter.

## 6. Responsive Behavior

- Primary target: desktop/laptop (1280px+), since this is staff data-entry software.
- Tablet (768px+): sidebar collapses to a top bar or hamburger menu; tables scroll horizontally rather than breaking layout.
- Phone support is a nice-to-have, not required for MVP.

## 7. Accessibility Notes

- All status badges must not rely on color alone — pair with text/icon (e.g., a red badge that also says "Debarred," not just a red dot).
- Form inputs have visible labels (not placeholder-only).
- Sufficient contrast ratio (WCAG AA) for all status colors against their backgrounds.
- All interactive elements keyboard-navigable and focus-visible.
