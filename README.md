# 🎓 GradeTrack — Academic OS & Student Analytics Engine

A production-ready, full-stack institutional academic management system engineered to manage student records, automate grading calculations (SGPA/CGPA), enforce attendance policies, manage assignments, and monitor academic probation.

---

## 🔗 Live Deployments

- 🌐 **Live Web Application (Frontend)**: [https://grade-track-nine.vercel.app](https://grade-track-nine.vercel.app/)) *(Update with your Vercel URL)*
- ⚙️ **Production API (Backend)**: [https://grade-track.onrender.com](https://grade-track.onrender.com)
- 🩺 **API Health Check**: [https://grade-track.onrender.com/health](https://grade-track.onrender.com/health)

---

## ⚡ Key Highlights & Core Features

- **Academic Evaluation Engine**: Computes real-time Semester Grade Point Average (SGPA) and Cumulative Grade Point Average (CGPA) with zero-grade penalty handling for failed subjects.
- **Attendance Gatekeeper**: Real-time evaluation against institutional attendance rules (< 75% triggers `DEBARRED` status; >= 75% grants `ELIGIBLE` status).
- **Academic Standing & Backlog Tracking**: Automated classification into `SCHOLARSHIP` (CGPA >= 8.5 & 0 Backlogs), `GOOD_STANDING`, and `PROBATION` (active F-grade backlogs highlighted across directories and transcripts).
- **Flexible Subject & Marks Management**: Partial field updates allowed with strict boundary validation (0–100 marks per subject).
- **Assignments & Coursework Roster**: Department- and semester-targeted coursework with status tracking (`Submitted`, `Pending`, `Late`) and instant grading.
- **Transcript Generator**: Instant generation and printable preview of academic transcripts per semester.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Sonner |
| **Backend** | Node.js, Express.js, TypeScript, tsx |
| **Database & ORM** | Supabase (PostgreSQL), Prisma ORM |
| **Authentication** | Role-based JWT Access with bcrypt hashing |
| **Deployment** | Vercel (Frontend), Render (Backend) |

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
│   │   ├── components/         # UI widgets, modal forms, badges
│   │   ├── pages/              # Dashboard, Students, Leaderboard, Assignments
│   │   └── lib/api.ts          # Central Axios API client
│   └── package.json
└── README.md
