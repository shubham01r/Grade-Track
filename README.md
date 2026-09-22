# 🎓 GradeTrack — Academic OS & Student Analytics Engine

A production-ready, full-stack institutional academic management system designed to track student progress, automate grading engines (SGPA/CGPA), enforce attendance policies, manage assignments, and monitor academic probation.

---

## ⚡ Key Highlights & Core Features

- **Academic Evaluation Engine**: Automated real-time computation of Semester Grade Point Average (SGPA) and Cumulative Grade Point Average (CGPA) with zero-grade penalty handling for failed subjects.
- **Attendance Gatekeeper**: Real-time evaluation against institutional rules (threshold < 75% triggers an automated `DEBARRED` status; >= 75% grants `ELIGIBLE` status).
- **Academic Standing & Backlog Tracking**: Automated classification into `SCHOLARSHIP` (CGPA >= 8.5 & 0 Backlogs), `GOOD_STANDING`, and `PROBATION` (active F-grade backlogs highlighted across directories and transcripts).
- **Assignments & Submission Tracker**: Department and semester-targeted coursework management with real-time roster tracking (`Submitted`, `Pending`, `Late`) and one-click grading.
- **Transcript Generator**: Instant generation and printable preview of detailed academic transcripts per semester.
- **Adaptive Dark/Light Mixture UI**: Built with accessible contrast palettes, custom glassmorphism panels, and collapsible navigation.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Sonner |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database & ORM** | Supabase (PostgreSQL), Prisma ORM |
| **Authentication** | Role-based JWT Access with bcrypt hashing |
| **Deployment** | Vercel (Frontend), Render / Railway (Backend) |

---

## 📁 Repository Structure

```text
Grade-Track/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (Students, Semesters, Courses, Assignments)
│   │   └── seed.ts             # Demo data with admin, probation profiles & coursework
│   ├── src/
│   │   ├── controllers/        # Request handling logic
│   │   ├── routes/             # REST API endpoints (/api/v1/...)
│   │   └── server.ts           # Express server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI widgets, badges, and modals
│   │   ├── pages/              # Dashboard, Students, Leaderboard, Assignments
│   │   └── lib/api.ts          # Central Axios API client
│   └── package.json
└── README.md
