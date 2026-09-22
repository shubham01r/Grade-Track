import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppLayout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import DashboardPage from './pages/DashboardPage';
import ExportPage from './pages/ExportPage';
import LeaderboardPage from './pages/LeaderboardPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import ReportCardPage from './pages/ReportCardPage';
import StudentProfilePage from './pages/StudentProfilePage';
import StudentsPage from './pages/StudentsPage';
import AssignmentsPage from './pages/AssignmentsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster position="top-right" richColors closeButton theme="dark" />
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="students/:id" element={<StudentProfilePage />} />
            <Route path="students/:id/report" element={<ReportCardPage />} />
            <Route path="assignments" element={<AssignmentsPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          </Routes>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
