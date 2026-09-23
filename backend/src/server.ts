import dotenv from 'dotenv';
import app from './app.js';
import prisma from './lib/prisma.js';
import { seedDatabase } from '../prisma/seed.js';

dotenv.config();

const port = Number(process.env.PORT ?? 4000);

async function startServer() {
  try {
    const admin = await prisma.adminUser.findUnique({
      where: { email: 'admin@gradetrack.local' },
      select: { id: true },
    });

    if (!admin) {
      console.log('Demo admin was not found. Seeding the GradeTrack demo dataset...');
      await seedDatabase();
      console.log('GradeTrack demo dataset seeded successfully.');
    }
  } catch (error) {
    // Keep the web process available so Render health checks can pass while the
    // database is temporarily unreachable. The next restart retries seeding.
    console.error('Demo seed check failed; the server will still start:', error);
  }

  app.listen(port, () => {
    console.log(`GradeTrack backend running on http://localhost:${port}`);
  });
}

void startServer();
