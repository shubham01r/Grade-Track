import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import semesterRoutes from './routes/semesters.js';
import settingsRoutes from './routes/settings.js';
import leaderboardRoutes from './routes/leaderboard.js';
import exportRoutes from './routes/export.js';
import reportRoutes from './routes/report.js';
import assignmentRoutes from './routes/assignments.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'gradetrack-backend' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/semesters', semesterRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/export', exportRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1', reportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
