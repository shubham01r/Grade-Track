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



🚀 Getting Started Locally
1. Prerequisites
Node.js: v18.0 or higher

npm or pnpm

A free Supabase PostgreSQL database instance

2. Backend Setup
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
Add your credentials inside backend/.env:

PORT=4000
DATABASE_URL="your-supabase-connection-string"
DIRECT_URL="your-supabase-direct-connection-string"
JWT_SECRET="your-secure-jwt-secret"
NODE_ENV="development"
Push schema and seed database:

# Push Prisma schema to Supabase
npx prisma db push

# Populate initial admin and academic records
npm run prisma:seed

# Start backend server
npm run dev
Backend runs locally at: http://localhost:4000

3. Frontend Setup

# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
Add your API target inside frontend/.env:

VITE_API_URL="http://localhost:4000/api/v1"
Start the Vite development server:

npm run dev
Frontend runs locally at: http://localhost:5173

🔑 Default Admin Credentials
Email: admin@gradetrack.local

Password: Password123!

🌐 Production Deployment Guide
Backend (Render / Railway)
Link your GitHub repository (Grade-Track).

Set Root Directory to backend.

Set Build Command: npm install && npx prisma generate && npm run build

Set Start Command: node dist/server.js (or npm run start)

Configure Environment Variables: DATABASE_URL, DIRECT_URL, JWT_SECRET, NODE_ENV=production.

Frontend (Vercel)
Import repository and set Root Directory to frontend.

Framework Preset: Vite.

Set Environment Variable: VITE_API_URL to https://<your-backend-service>.onrender.com/api/v1.

Click Deploy.

📜 License
This project is licensed under the MIT License.
