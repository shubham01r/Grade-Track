import { AnimatePresence, motion } from 'framer-motion';
import { CalendarPlus, Check, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import apiClient from '../api/client';
import type { Semester } from '../types/student';

type CourseDraft = {
  subject_code: string;
  subject_name: string;
  credits: number;
  subject_type: 'THEORY' | 'LAB';
  internal_marks: number;
  end_sem_marks: number;
};

const emptyCourse: CourseDraft = {
  subject_code: '',
  subject_name: '',
  credits: 4,
  subject_type: 'THEORY',
  internal_marks: 0,
  end_sem_marks: 0,
};

export function SemesterModal({
  open,
  studentId,
  onClose,
  onSaved,
}: {
  open: boolean;
  studentId: string;
  onClose: () => void;
  onSaved: (semester: Semester) => void;
}) {
  const [semesterNumber, setSemesterNumber] = useState(1);
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [totalLectures, setTotalLectures] = useState(100);
  const [attendedLectures, setAttendedLectures] = useState(75);
  const [courses, setCourses] = useState<CourseDraft[]>([{ ...emptyCourse }]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const attendancePercentage = useMemo(() => totalLectures > 0 ? (attendedLectures / totalLectures) * 100 : 0, [attendedLectures, totalLectures]);
  const isDebarred = attendancePercentage < 75;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (attendedLectures > totalLectures) {
        setError('Lectures attended cannot exceed lectures conducted.');
        return;
      }
      if (courses.some((course) => !course.subject_code.trim() || !course.subject_name.trim())) {
        setError('Complete the course code and subject name for every course.');
        return;
      }

      const { data } = await apiClient.post(`/students/${studentId}/semesters`, {
        semester_number: Number(semesterNumber),
        academic_year: academicYear,
        attended_lectures: Number(attendedLectures),
        total_lectures: Number(totalLectures),
      });

      await Promise.all(courses.map((course) => apiClient.post(`/semesters/${data.id}/subjects`, {
        subject_code: course.subject_code,
        subject_name: course.subject_name,
        subject_type: course.subject_type,
        credits: Number(course.credits),
        theory_max_marks: 100,
        theory_marks_obtained: Number(course.internal_marks) + Number(course.end_sem_marks),
      })));

      if (!isDebarred) {
        await apiClient.post(`/semesters/${data.id}/evaluate`, { force: false });
      }

      toast.success(isDebarred ? 'Semester saved. Attendance is below the evaluation threshold.' : 'Semester saved and evaluated successfully.');
      onSaved(data);
      onClose();
      setSemesterNumber(1);
      setAcademicYear('2025-2026');
      setTotalLectures(100);
      setAttendedLectures(75);
      setCourses([{ ...emptyCourse }]);
    } catch (err: any) {
      const message = err?.response?.data?.error?.message ?? 'Unable to create semester.';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#050816]/75 px-4 py-6 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            className="glass-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border-violet-400/20 bg-slate-900/85 p-6 shadow-[0_0_55px_rgba(139,92,246,0.16)] sm:p-7"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-400/10 p-2.5 text-violet-200 ring-1 ring-violet-400/20"><CalendarPlus className="h-5 w-5" /></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-violet-300">Academic Term</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Add Semester</h2>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:border-violet-400/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Semester Number</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={semesterNumber}
                    onChange={(event) => setSemesterNumber(Number(event.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-400/60 focus:bg-violet-400/5"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Academic Year</label>
                  <input
                    value={academicYear}
                    onChange={(event) => setAcademicYear(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-400/60 focus:bg-violet-400/5"
                    placeholder="2025-2026"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Lectures Conducted</label>
                  <input type="number" min={1} value={totalLectures} onChange={(event) => setTotalLectures(Number(event.target.value))} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-400/60 focus:bg-violet-400/5" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Lectures Attended</label>
                  <input type="number" min={0} value={attendedLectures} onChange={(event) => setAttendedLectures(Number(event.target.value))} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-400/60 focus:bg-violet-400/5" required />
                </div>
                <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                  <span className="text-sm text-slate-400">Attendance status</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isDebarred ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'}`}>{attendancePercentage.toFixed(2)}% · {isDebarred ? 'Debarred' : 'Eligible'}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-3 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-violet-300">Coursework</p><h3 className="mt-1 font-semibold text-white">Course / Marks Entry</h3></div><button type="button" onClick={() => setCourses((current) => [...current, { ...emptyCourse }])} className="rounded-lg border border-violet-300/40 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200">+ Add course</button></div>
                <div className="space-y-3">
                  {courses.map((course, index) => (
                    <div key={index} className="rounded-xl border border-white/10 bg-white/60 p-3 dark:bg-slate-950/30">
                      <div className="grid gap-3 md:grid-cols-2">
                        <input value={course.subject_code} onChange={(event) => setCourses((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, subject_code: event.target.value } : item))} className="rounded-lg border border-white/10 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 dark:bg-white/5 dark:text-white" placeholder="Course code" required />
                        <input value={course.subject_name} onChange={(event) => setCourses((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, subject_name: event.target.value } : item))} className="rounded-lg border border-white/10 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 dark:bg-white/5 dark:text-white" placeholder="Subject name" required />
                        <input type="number" min={1} value={course.credits} onChange={(event) => setCourses((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, credits: Number(event.target.value) } : item))} className="rounded-lg border border-white/10 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 dark:bg-white/5 dark:text-white" placeholder="Credits" required />
                        <select value={course.subject_type} onChange={(event) => setCourses((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, subject_type: event.target.value as CourseDraft['subject_type'] } : item))} className="rounded-lg border border-white/10 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 dark:bg-white/5 dark:text-white"><option value="THEORY">Theory</option><option value="LAB">Practical / Lab</option></select>
                        <input type="number" min={0} max={50} value={course.internal_marks} onChange={(event) => setCourses((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, internal_marks: Number(event.target.value) } : item))} className="rounded-lg border border-white/10 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 dark:bg-white/5 dark:text-white" placeholder="Internal marks / 50" required />
                        <div className="flex gap-2"><input type="number" min={0} max={50} value={course.end_sem_marks} onChange={(event) => setCourses((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, end_sem_marks: Number(event.target.value) } : item))} className="w-full rounded-lg border border-white/10 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 dark:bg-white/5 dark:text-white" placeholder="End-sem / 50" required />{courses.length > 1 && <button type="button" onClick={() => setCourses((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg border border-rose-200 px-2 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300"> <X className="h-4 w-4" /></button>}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-red-300">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(139,92,246,0.25)] transition hover:-translate-y-0.5 disabled:opacity-70">
                  {submitting ? 'Saving & evaluating...' : <><Check className="h-4 w-4" />Save &amp; Evaluate</>}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
