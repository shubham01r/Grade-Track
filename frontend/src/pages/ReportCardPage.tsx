import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, FileText, Printer } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import type { Student, Subject } from '../types/student';

type ReportResponse = {
  student: Student;
  report: {
    total_semesters: number;
    total_credits: number;
    active_backlogs: number;
  };
};

function statusTone(status: Student['scholarship_status']) {
  if (status === 'SCHOLARSHIP' || status === 'HONOR_ROLL') return 'scholarship' as const;
  if (status === 'PROBATION') return 'backlog' as const;
  return 'good' as const;
}

export default function ReportCardPage() {
  const { id } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['report', id],
    queryFn: async () => {
      const response = await apiClient.get(`/students/${id}/report`);
      return response.data as ReportResponse;
    },
    enabled: Boolean(id),
  });

  const exportReport = async () => {
    try {
      const response = await apiClient.get('/export/csv', {
        params: { studentId: id },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${data?.student.roll_number ?? 'student'}-report.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Report exported.');
    } catch {
      toast.error('Unable to export this report.');
    }
  };

  if (isLoading) return <div className="p-8 text-slate-200">Loading report card...</div>;
  if (isError || !data) return <div className="p-8 text-red-300">Unable to load this report card.</div>;

  const { student } = data;
  const semesters = student.semesters ?? [];
  const backlogs = semesters.flatMap((semester) => (semester.subjects ?? []).filter((subject) => subject.is_backlog).map((subject) => ({ semester, subject })));
  const statusLabel = student.scholarship_status === 'PROBATION' && backlogs.length > 0
    ? `PROBATION (${backlogs.length} BACKLOGS)`
    : student.scholarship_status ?? 'GOOD_STANDING';

  return (
    <div className="min-h-screen p-8 print:bg-white print:p-0 print:text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link to={`/students/${student.id}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to profile
          </Link>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button onClick={exportReport} className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-[0_0_35px_rgba(15,23,42,0.55)] print:rounded-none print:border-0 print:bg-white print:p-8 print:shadow-none">
          <header className="flex flex-col gap-5 border-b border-slate-700 pb-6 sm:flex-row sm:items-center sm:justify-between print:border-slate-300">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="GradeTrack institution logo" className="h-16 w-16 rounded-xl object-cover print:rounded-none" />
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-300 print:text-slate-500">Academic Records Office</p>
                <h1 className="mt-1 text-2xl font-semibold text-white print:text-slate-900">GradeTrack Transcript</h1>
                <p className="mt-1 text-sm text-slate-400 print:text-slate-600">Official student performance report</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 print:text-slate-500">Report Status</p>
              <div className="mt-2"><StatusBadge label={statusLabel} tone={statusTone(student.scholarship_status)} /></div>
            </div>
          </header>

          <section className="grid gap-4 border-b border-slate-700 py-6 sm:grid-cols-2 lg:grid-cols-4 print:border-slate-300">
            <div><p className="text-xs uppercase tracking-[0.15em] text-slate-400 print:text-slate-500">Student</p><p className="mt-1 font-semibold text-white print:text-slate-900">{student.full_name}</p></div>
            <div><p className="text-xs uppercase tracking-[0.15em] text-slate-400 print:text-slate-500">Roll Number</p><p className="mt-1 font-semibold text-white print:text-slate-900">{student.roll_number}</p></div>
            <div><p className="text-xs uppercase tracking-[0.15em] text-slate-400 print:text-slate-500">Programme</p><p className="mt-1 font-semibold text-white print:text-slate-900">{student.department} · {student.degree_type}</p></div>
            <div><p className="text-xs uppercase tracking-[0.15em] text-slate-400 print:text-slate-500">Admission Year</p><p className="mt-1 font-semibold text-white print:text-slate-900">{student.admission_year}</p></div>
          </section>

          <section className="grid gap-4 py-6 sm:grid-cols-3">
            <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 print:border-slate-300 print:bg-slate-50"><p className="text-xs uppercase tracking-[0.15em] text-slate-400 print:text-slate-500">Final CGPA</p><p className="mt-2 text-4xl font-semibold text-white print:text-slate-900">{student.cgpa ?? '—'}</p></div>
            <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4 print:border-slate-300 print:bg-white"><p className="text-xs uppercase tracking-[0.15em] text-slate-400 print:text-slate-500">Total Credits</p><p className="mt-2 text-3xl font-semibold text-white print:text-slate-900">{data.report.total_credits}</p></div>
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 print:border-slate-300 print:bg-white"><p className="text-xs uppercase tracking-[0.15em] text-rose-300 print:text-slate-500">Pending Backlogs</p><p className="mt-2 text-3xl font-semibold text-rose-300 print:text-slate-900">{data.report.active_backlogs}</p></div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-sky-300 print:text-slate-700" /><h2 className="text-xl font-semibold text-white print:text-slate-900">Semester Breakdown</h2></div>
            {semesters.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-700 p-5 text-slate-400 print:border-slate-300 print:text-slate-600">No academic records are available yet.</p>
            ) : semesters.map((semester) => (
              <div key={semester.id} className="overflow-hidden rounded-xl border border-slate-700 print:border-slate-300">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 px-4 py-3 print:bg-slate-100">
                  <div><h3 className="font-semibold text-white print:text-slate-900">Semester {semester.semester_number} · {semester.academic_year}</h3><p className="text-xs text-slate-400 print:text-slate-600">Attendance: {semester.attendance_percentage ?? 0}%</p></div>
                  <div className="flex items-center gap-3 text-sm"><span className="text-slate-400 print:text-slate-600">SGPA</span><strong className="text-lg text-sky-300 print:text-slate-900">{semester.sgpa ?? '—'}</strong>{semester.is_debarred && <StatusBadge label="Debarred" tone="debarred" />}</div>
                </div>
                <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-900/60 text-xs uppercase tracking-[0.1em] text-slate-400 print:bg-white print:text-slate-600"><tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Credits</th><th className="px-4 py-3">Marks</th><th className="px-4 py-3">Grade</th><th className="px-4 py-3">Grade Point</th></tr></thead><tbody>{(semester.subjects ?? []).map((subject: Subject) => <tr key={subject.id} className={`border-t print:border-slate-200 ${subject.is_backlog ? 'border-rose-500/30 bg-rose-500/10' : 'border-slate-800'}`}><td className="px-4 py-3 text-slate-300 print:text-slate-700">{subject.subject_code}</td><td className="px-4 py-3 font-medium text-white print:text-slate-900">{subject.subject_name}{subject.is_backlog && <span className="ml-2 rounded-full border border-rose-500/40 bg-rose-950/60 px-2 py-0.5 text-[10px] font-semibold text-rose-300 print:border-slate-300 print:bg-white print:text-slate-900">BACKLOG</span>}</td><td className="px-4 py-3 text-slate-300 print:text-slate-700">{subject.credits}</td><td className="px-4 py-3 text-slate-300 print:text-slate-700">{subject.total_marks_obtained ?? '—'}</td><td className={`px-4 py-3 font-semibold ${subject.is_backlog ? 'text-rose-300' : 'text-white'} print:text-slate-900`}>{subject.grade_letter ?? '—'}</td><td className="px-4 py-3 text-slate-300 print:text-slate-700">{subject.grade_point ?? '—'}</td></tr>)}</tbody></table></div>
              </div>
            ))}
          </section>

          <section className="mt-8 border-t border-slate-700 pt-6 print:border-slate-300">
            <h2 className="text-lg font-semibold text-white print:text-slate-900">Active Backlog Summary</h2>
            {backlogs.length === 0 ? <p className="mt-3 text-sm text-emerald-300 print:text-slate-700">No active backlogs recorded.</p> : <div className="mt-3 grid gap-2 sm:grid-cols-2">{backlogs.map(({ semester, subject }) => <div key={subject.id} className="rounded-lg border border-rose-500/40 bg-rose-950/60 px-3 py-2 text-sm text-rose-300 print:border-slate-300 print:bg-white print:text-slate-900">Semester {semester.semester_number}: {subject.subject_code} · {subject.subject_name} · BACKLOG</div>)}</div>}
          </section>
        </article>
      </div>
    </div>
  );
}
