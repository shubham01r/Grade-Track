import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList, Clock3, FilePlus2, GraduationCap, Save, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

type Assignment = {
  id: string;
  title: string;
  description?: string | null;
  department: string;
  semester: number;
  dueDate: string;
  maxMarks: number;
  totalAssignedStudents: number;
  submittedCount: number;
  pendingCount: number;
  lateCount: number;
};

type RosterSubmission = {
  id: string;
  studentId: string;
  status: 'SUBMITTED' | 'PENDING' | 'LATE' | 'GRADED';
  submittedAt: string | null;
  obtainedMarks: number | null;
  feedback: string | null;
  student: { id: string; full_name: string; roll_number: string };
};

type AssignmentDetail = Assignment & { submissions: RosterSubmission[] };

const departments = ['Computer Science', 'Information Technology', 'Mechanical', 'Electronics'];

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function assignmentStatusTone(assignment: Assignment) {
  const progress = assignment.totalAssignedStudents ? assignment.submittedCount / assignment.totalAssignedStudents : 0;
  return progress >= 0.75 ? 'good' as const : progress >= 0.4 ? 'scholarship' as const : 'backlog' as const;
}

export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const assignmentsQuery = useQuery({
    queryKey: ['assignments', department, semester],
    queryFn: async () => (await apiClient.get('/assignments', { params: { dept: department || undefined, semester: semester || undefined } })).data as Assignment[],
  });
  const detailQuery = useQuery({
    queryKey: ['assignment', selectedId],
    queryFn: async () => (await apiClient.get(`/assignments/${selectedId}`)).data as AssignmentDetail,
    enabled: Boolean(selectedId),
  });

  const assignments = assignmentsQuery.data ?? [];
  const totalAssigned = assignments.reduce((sum, assignment) => sum + assignment.totalAssignedStudents, 0);
  const totalSubmitted = assignments.reduce((sum, assignment) => sum + assignment.submittedCount, 0);
  const pending = assignments.reduce((sum, assignment) => sum + assignment.pendingCount, 0);
  const rate = totalAssigned ? Math.round((totalSubmitted / totalAssigned) * 100) : 0;
  const kpis = [
    { label: 'Active Assignments', value: assignments.length, icon: ClipboardList, color: 'text-indigo-600', iconBg: 'bg-indigo-50' },
    { label: 'Overall Submission Rate', value: `${rate}%`, icon: Send, color: 'text-emerald-600', iconBg: 'bg-emerald-50' },
    { label: 'Pending Submissions', value: pending, icon: Clock3, color: 'text-rose-600', iconBg: 'bg-rose-50' },
  ];

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['assignments'] });
    if (selectedId) queryClient.invalidateQueries({ queryKey: ['assignment', selectedId] });
  };

  return (
    <div className="assignments-page mx-auto max-w-[1600px] p-5 sm:p-8">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-cyan-600"><ClipboardList className="h-4 w-4" /> Academic workflow</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Assignments</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Track submissions, feedback, and marks across every cohort.</p></div>
        <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5"><FilePlus2 className="h-4 w-4" /> Create Assignment</button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {kpis.map(({ label, value, icon: Icon, color, iconBg }) => <div key={label} className="glass-panel rounded-3xl p-5"><div className="flex items-center justify-between"><p className="text-sm text-slate-500 dark:text-slate-400">{label}</p><div className={`rounded-xl p-2.5 ${iconBg}`}><Icon className={`h-5 w-5 ${color}`} /></div></div><p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p></div>)}
      </div>

      <div className="glass-panel mb-6 rounded-3xl p-4"><div className="grid gap-3 md:grid-cols-2"><select value={department} onChange={(event) => setDepartment(event.target.value)} className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"><option value="">All departments</option>{departments.map((item) => <option key={item}>{item}</option>)}</select><select value={semester} onChange={(event) => setSemester(event.target.value)} className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"><option value="">All semesters</option>{Array.from({ length: 8 }, (_, index) => <option key={index + 1} value={index + 1}>Semester {index + 1}</option>)}</select></div></div>

      {assignmentsQuery.isLoading ? <div className="glass-panel rounded-3xl p-8 text-slate-500">Loading assignments...</div> : assignmentsQuery.isError ? <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">Unable to load assignments.</div> : <div className="grid gap-4 lg:grid-cols-2">{assignments.map((assignment) => { const progress = assignment.totalAssignedStudents ? Math.round((assignment.submittedCount / assignment.totalAssignedStudents) * 100) : 0; return <motion.button type="button" key={assignment.id} onClick={() => setSelectedId(assignment.id)} whileHover={{ y: -3 }} className="glass-panel glass-hover rounded-3xl p-5 text-left"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600">{assignment.department} · Semester {assignment.semester}</p><h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{assignment.title}</h2><p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{assignment.description ?? 'No description provided.'}</p></div><StatusBadge label={`${progress}%`} tone={assignmentStatusTone(assignment)} /></div><div className="mt-5 flex items-center justify-between text-xs text-slate-500"><span>Due {formatDate(assignment.dueDate)}</span><span>{assignment.submittedCount} / {assignment.totalAssignedStudents} Submitted</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-3 text-xs font-medium text-cyan-700 dark:text-cyan-300">View Roster <span aria-hidden="true">→</span></p></motion.button>; })}</div>}

      <CreateAssignmentModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); refresh(); }} />
      <RosterModal assignment={detailQuery.data ?? null} loading={detailQuery.isLoading} onClose={() => setSelectedId(null)} onUpdated={refresh} />
    </div>
  );
}

function CreateAssignmentModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', department: departments[0], semester: 1, dueDate: '', maxMarks: 100 });
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); try { await apiClient.post('/assignments', { ...form, semester: Number(form.semester), maxMarks: Number(form.maxMarks), dueDate: new Date(form.dueDate).toISOString() }); toast.success('Assignment created and student roster generated.'); onCreated(); setForm({ title: '', description: '', department: departments[0], semester: 1, dueDate: '', maxMarks: 100 }); } catch (error: any) { toast.error(error?.response?.data?.error?.message ?? 'Unable to create assignment.'); } finally { setSaving(false); } };
  return <AnimatePresence>{open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-md"><motion.form onSubmit={submit} initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass-panel w-full max-w-xl rounded-3xl bg-white/95 p-6 dark:bg-slate-900/95"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-cyan-600">New coursework</p><h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">Create Assignment</h2></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button></div><div className="grid gap-4 md:grid-cols-2"><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Assignment title" className="md:col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white" /><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description (optional)" className="md:col-span-2 min-h-24 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white" /><select value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white">{departments.map((item) => <option key={item}>{item}</option>)}</select><select value={form.semester} onChange={(event) => setForm({ ...form, semester: Number(event.target.value) })} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white">{Array.from({ length: 8 }, (_, index) => <option key={index + 1} value={index + 1}>Semester {index + 1}</option>)}</select><input required type="datetime-local" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white" /><input required type="number" min={1} value={form.maxMarks} onChange={(event) => setForm({ ...form, maxMarks: Number(event.target.value) })} placeholder="Maximum marks" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white" /></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Creating...' : 'Create Assignment'}</button></div></motion.form></motion.div>}</AnimatePresence>;
}

function RosterModal({ assignment, loading, onClose, onUpdated }: { assignment: AssignmentDetail | null; loading: boolean; onClose: () => void; onUpdated: () => void }) {
  const [updating, setUpdating] = useState<string | null>(null);
  const update = async (submission: RosterSubmission, status: RosterSubmission['status'], marks: string) => { setUpdating(submission.id); try { await apiClient.patch(`/assignments/${assignment?.id}/submissions/${submission.studentId}`, { status, obtainedMarks: marks === '' ? null : Number(marks) }); toast.success('Submission updated.'); onUpdated(); } catch { toast.error('Unable to update submission.'); } finally { setUpdating(null); } };
  return <AnimatePresence>{assignment && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-md"><motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white/95 p-6 dark:bg-slate-900/95"><div className="mb-5 flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-cyan-600">Submission roster</p><h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{assignment.title}</h2><p className="mt-1 text-sm text-slate-500">{assignment.submittedCount} of {assignment.totalAssignedStudents} submitted · Due {formatDate(assignment.dueDate)}</p></div><button onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button></div>{loading ? <p className="p-8 text-slate-500">Loading roster...</p> : <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-white/5"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3">Marks</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{assignment.submissions.map((submission) => <tr key={submission.id} className="border-t border-slate-200/70 dark:border-white/10"><td className="px-4 py-3"><p className="font-medium text-slate-900 dark:text-white">{submission.student.full_name}</p><p className="text-xs text-slate-500">{submission.student.roll_number}</p></td><td className="px-4 py-3"><StatusBadge label={submission.status} tone={submission.status === 'SUBMITTED' || submission.status === 'GRADED' ? 'good' : submission.status === 'LATE' ? 'debarred' : 'backlog'} /></td><td className="px-4 py-3 text-slate-500">{submission.submittedAt ? formatDate(submission.submittedAt) : '—'}</td><td className="px-4 py-3"><input aria-label={`Marks for ${submission.student.full_name}`} defaultValue={submission.obtainedMarks ?? ''} id={`marks-${submission.id}`} type="number" min={0} max={assignment.maxMarks} className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white" /></td><td className="px-4 py-3"><button type="button" disabled={updating === submission.id} onClick={() => update(submission, submission.status === 'PENDING' || submission.status === 'LATE' ? 'SUBMITTED' : 'PENDING', (document.getElementById(`marks-${submission.id}`) as HTMLInputElement)?.value ?? '')} className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300"><GraduationCap className="h-3.5 w-3.5" />{submission.status === 'PENDING' || submission.status === 'LATE' ? 'Mark Submitted' : 'Mark Pending'}</button></td></tr>)}</tbody></table></div>}</motion.div></motion.div>}</AnimatePresence>;
}
