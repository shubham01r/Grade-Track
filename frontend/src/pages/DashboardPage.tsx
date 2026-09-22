import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, ArrowRight, BarChart3, Download, GraduationCap, Play, Plus, ShieldAlert, Sparkles, TrendingUp, UserPlus, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import type { Student } from '../types/student';

export default function DashboardPage() {
  const { data: students = [], isLoading, isError } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data } = await apiClient.get('/students');
      return data as Student[];
    },
  });

  const semesters = students.flatMap((student) => student.semesters ?? []);
  const activeBacklogs = semesters.reduce((total, semester) => total + (semester.subjects ?? []).filter((subject) => subject.is_backlog).length, 0);
  const debarred = semesters.filter((semester) => semester.is_debarred).length;
  const scholarshipEligible = students.filter((student) => student.scholarship_status === 'SCHOLARSHIP' || student.scholarship_status === 'HONOR_ROLL').length;
  const evaluatedStudents = students.filter((student) => student.cgpa !== null && student.cgpa !== undefined);
  const averageCgpa = evaluatedStudents.length ? evaluatedStudents.reduce((sum, student) => sum + Number(student.cgpa), 0) / evaluatedStudents.length : 0;
  const topPerformer = [...evaluatedStudents].sort((a, b) => Number(b.cgpa) - Number(a.cgpa))[0];
  const gradeDistribution = semesters.flatMap((semester) => semester.subjects ?? []).reduce<Record<string, number>>((distribution, subject) => {
    const grade = subject.grade_letter ?? 'Pending';
    distribution[grade] = (distribution[grade] ?? 0) + 1;
    return distribution;
  }, {});
  const totalGrades = Object.values(gradeDistribution).reduce((sum, value) => sum + value, 0);
  const gradeOrder = ['O', 'A+', 'A', 'B', 'C', 'D', 'F', 'Pending'];
  const gradeColors: Record<string, string> = { O: 'bg-cyan-400', 'A+': 'bg-indigo-400', A: 'bg-violet-400', B: 'bg-emerald-400', C: 'bg-amber-400', D: 'bg-orange-400', F: 'bg-rose-400', Pending: 'bg-slate-500' };

  const metrics = [
    { label: 'Students Enrolled', value: students.length, detail: '+12% vs last term', icon: Users, tone: 'from-cyan-400/20 to-cyan-400/5', iconTone: 'text-cyan-200', accent: 'text-cyan-200' },
    { label: 'Class Performance', value: averageCgpa ? averageCgpa.toFixed(2) : '—', detail: `${evaluatedStudents.length} evaluated students`, icon: TrendingUp, tone: 'from-indigo-400/20 to-indigo-400/5', iconTone: 'text-indigo-200', accent: 'text-indigo-200' },
    { label: 'Attendance Risk', value: debarred, detail: 'Below 75% threshold', icon: ShieldAlert, tone: 'from-amber-400/20 to-rose-400/5', iconTone: 'text-amber-200', accent: 'text-amber-200' },
    { label: 'Top Performer', value: topPerformer?.cgpa?.toString() ?? '—', detail: topPerformer?.full_name ?? 'Awaiting evaluated records', icon: GraduationCap, tone: 'from-violet-400/20 to-fuchsia-400/5', iconTone: 'text-violet-200', accent: 'text-violet-200' },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-5 sm:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-cyan-300"><Activity className="h-4 w-4" /> Command center</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Good morning, Admin</h1>
          <p className="mt-2 text-sm text-slate-400">A live view of academic performance across your institution.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/students" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-3.5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/15"><Plus className="h-4 w-4" />Register Student</Link>
          <Link to="/leaderboard" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-medium text-slate-200 hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-white">View Leaderboard<ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>

      {isLoading && <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-300">Loading academic metrics...</div>}
      {isError && <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-red-200">Unable to load dashboard metrics.</div>}

      {!isLoading && !isError && students.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-3xl border-dashed border-cyan-400/40 px-6 py-16 text-center shadow-[0_0_30px_rgba(14,165,233,0.1)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300"><Sparkles className="h-7 w-7" /></div>
          <h2 className="mt-5 text-2xl font-semibold text-white">Your academic workspace is ready</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">Register your first student to start tracking semesters, attendance, grades, and scholarship eligibility.</p>
          <Link to="/students" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950"><Plus className="h-4 w-4" />Add your first student</Link>
        </motion.div>
      ) : !isLoading && !isError && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, detail, icon: Icon, tone, iconTone, accent }, index) => (
              <motion.div key={label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }} className={`glass-panel glass-hover relative overflow-hidden rounded-3xl bg-gradient-to-br ${tone} p-5`}>
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/5 blur-2xl" />
                <div className="relative flex items-start justify-between"><div><p className="text-sm text-slate-400">{label}</p><p className={`mt-4 text-3xl font-semibold tracking-tight ${accent}`}>{value}</p></div><div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10"><Icon className={`h-5 w-5 ${iconTone}`} /></div></div>
                <p className="relative mt-4 truncate text-xs text-slate-400">{detail}</p>
                {label === 'Class Performance' && <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-cyan-300" style={{ width: `${Math.min((averageCgpa / 10) * 100, 100)}%` }} /></div>}
              </motion.div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <section className="glass-panel rounded-3xl p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Workflow</p><h2 className="mt-1 text-xl font-semibold text-white">Quick Action Center</h2></div><Zap className="h-5 w-5 text-amber-300" /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { to: '/students', label: 'Add Student', hint: 'Create a new academic record', icon: UserPlus, color: 'text-cyan-200' },
                  { to: '/students', label: 'Record Attendance', hint: 'Update a semester gate', icon: Activity, color: 'text-emerald-200' },
                  { to: '/students', label: 'Run Evaluation', hint: 'Calculate grades and SGPA', icon: Play, color: 'text-violet-200' },
                  { to: '/export', label: 'Export Merit List', hint: 'Download filtered records', icon: Download, color: 'text-amber-200' },
                ].map(({ to, label, hint, icon: Icon, color }) => <Link key={label} to={to} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-cyan-400/40 hover:bg-cyan-400/10"><div className="rounded-xl bg-white/10 p-2.5"><Icon className={`h-5 w-5 ${color}`} /></div><div className="min-w-0"><p className="font-medium text-white">{label}</p><p className="truncate text-xs text-slate-500 group-hover:text-slate-300">{hint}</p></div><ArrowRight className="ml-auto h-4 w-4 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300" /></Link>)}
              </div>
            </section>

            <section className="glass-panel rounded-3xl p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Distribution</p><h2 className="mt-1 text-xl font-semibold text-white">Grade mix</h2></div><BarChart3 className="h-5 w-5 text-indigo-300" /></div>
              <div className="space-y-3">{gradeOrder.filter((grade) => gradeDistribution[grade]).map((grade) => { const count = gradeDistribution[grade]; const width = totalGrades ? (count / totalGrades) * 100 : 0; return <div key={grade}><div className="mb-1 flex justify-between text-xs"><span className="font-medium text-slate-200">{grade}</span><span className="text-slate-500">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><motion.div initial={{ width: 0 }} animate={{ width: `${width}%` }} transition={{ duration: 0.8 }} className={`h-full rounded-full ${gradeColors[grade]}`} /></div></div>; })}</div>
              {!totalGrades && <p className="text-sm text-slate-500">Grade distribution will appear after subjects are evaluated.</p>}
            </section>
          </div>

          <section className="glass-panel mt-6 rounded-3xl p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-violet-300">Audit trail</p><h2 className="mt-1 text-xl font-semibold text-white">Recent academic activity</h2></div><Link to="/students" className="text-sm text-cyan-300 hover:text-cyan-200">View records</Link></div>
            <div className="grid gap-3 md:grid-cols-3">
              {students.slice(0, 3).map((student, index) => <div key={student.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${index === 0 ? 'bg-cyan-400/15 text-cyan-200' : 'bg-indigo-400/15 text-indigo-200'}`}><GraduationCap className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{student.full_name}</p><p className="text-xs text-slate-500">{student.cgpa ? `CGPA updated to ${student.cgpa}` : 'Academic record registered'}</p></div><span className="ml-auto text-[10px] uppercase tracking-wider text-slate-600">{index + 1}d</span></div>)}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
