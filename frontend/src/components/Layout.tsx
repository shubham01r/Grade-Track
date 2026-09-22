import { motion } from 'framer-motion';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileDown,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Cloud,
  Moon,
  Sun,
  Menu,
  X,
  ClipboardList,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { AmbientBackground } from './AmbientBackground';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, iconColor: 'text-cyan-300', iconBg: 'bg-cyan-400/10' },
  { to: '/students', label: 'Students', icon: Users, iconColor: 'text-violet-300', iconBg: 'bg-violet-400/10' },
  { to: '/assignments', label: 'Assignments', icon: ClipboardList, iconColor: 'text-rose-300', iconBg: 'bg-rose-400/10' },
  { to: '/leaderboard', label: 'Leaderboard', icon: BarChart3, iconColor: 'text-amber-300', iconBg: 'bg-amber-400/10' },
  { to: '/export', label: 'Export', icon: FileDown, iconColor: 'text-emerald-300', iconBg: 'bg-emerald-400/10' },
  { to: '/settings', label: 'Settings', icon: Settings, iconColor: 'text-slate-300', iconBg: 'bg-slate-400/10' },
];

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="theme-app-canvas relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/50 text-slate-900 transition-colors duration-300">
      <AmbientBackground />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 min-h-screen flex-col border-r border-slate-200/80 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur-2xl transition-all duration-300 ease-in-out md:relative md:z-10 md:translate-x-0 ${collapsed ? 'md:w-20' : 'md:w-64'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute -right-28 top-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>
        <div className="relative border-b border-white/[0.08] px-4 py-5">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/15 to-indigo-500/20 shadow-[0_0_24px_rgba(56,189,248,0.16)] ring-1 ring-cyan-300/30">
              <img src="/logo.png" alt="GradeTrack" className="h-12 w-12 rounded-xl object-contain drop-shadow-[0_0_16px_rgba(56,189,248,0.45)]" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">GradeTrack</p>
                <div className="mt-1 flex items-center gap-1.5"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.9)]" /><p className="truncate text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">Academic Cloud OS</p></div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileOpen(false);
              } else {
                setCollapsed((value) => !value);
              }
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-200"
            aria-label="Toggle sidebar"
          >
            <span className="hidden md:inline">{collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</span>
            <span className="md:hidden"><X className="h-4 w-4" /></span>
          </button>
          </div>
          {!collapsed && <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[11px] text-slate-300"><Cloud className="h-3.5 w-3.5 text-cyan-300" /><span>Workspace online</span><span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" /></div>}
        </div>

        <nav className="relative space-y-2 px-3 py-6">
          {!collapsed && <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace</p>}
          {navItems.map(({ to, label, icon: Icon, iconColor, iconBg }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl border-l-4 px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out ${
                  isActive
                    ? 'border-cyan-400 bg-gradient-to-r from-cyan-500/20 via-indigo-500/15 to-transparent text-white shadow-lg shadow-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:translate-x-1 hover:border-cyan-400/40 hover:bg-gradient-to-r hover:from-cyan-400/10 hover:to-violet-400/5 hover:text-white'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
            >
              <span className={`rounded-xl p-2 transition duration-300 group-hover:scale-105 ${iconBg} ${iconColor}`}><Icon className="h-4 w-4 shrink-0" /></span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="relative px-3">
          {collapsed ? (
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
              aria-label="Switch Theme"
              title="Switch Theme"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/70 p-2.5 shadow-sm">
              <div className="flex items-center gap-2.5 text-sm font-medium text-slate-700"><span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">{theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</span><span>Theme: {theme === 'light' ? 'Light' : 'Dark'}</span></div>
              <button type="button" onClick={toggleTheme} className="relative h-6 w-11 rounded-full bg-slate-200 transition-colors duration-300" aria-label="Toggle theme">
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6 bg-indigo-600' : 'translate-x-1'}`} />
              </button>
            </div>
          )}
        </div>

        <div className={`relative mt-auto border-t border-white/[0.08] p-3 ${collapsed ? 'px-2' : 'px-0'}`}>
          <div className="mx-3 mb-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3 shadow-lg shadow-indigo-950/20">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 text-sm font-semibold text-slate-950 ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-slate-900">
                {user?.email?.slice(0, 1).toUpperCase() ?? 'A'}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">Admin</p>
                  <p className="truncate text-xs text-slate-400">{user?.email ?? 'admin@gradetrack.local'}</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />Supabase Connected</span>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                type="button"
                onClick={logout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition duration-300 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            )}
          </div>
        </div>
      </aside>

      {mobileOpen && <button type="button" aria-label="Close sidebar" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-sm md:hidden" />}

      <main className="relative z-10 flex-1 overflow-y-auto transition-all duration-300">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/75 px-4 py-3 backdrop-blur-xl md:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"><Menu className="h-4 w-4" /> Menu</button>
          <span className="bg-gradient-to-r from-cyan-500 to-indigo-500 bg-clip-text text-lg font-bold text-transparent">GradeTrack</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="min-h-screen"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
