import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, CheckCircle2, GraduationCap, Pencil, Plus, ShieldAlert, Sparkles, Trash2, TrendingUp } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '../api/client';
import { SemesterModal } from '../components/SemesterModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { SubjectEditModal } from '../components/SubjectEditModal';
import { StatusBadge } from '../components/StatusBadge';
import { fetchStudentById } from '../hooks/useStudents';
import type { Semester, Subject } from '../types/student';

const defaultSubjectForm = {
  subject_code: '',
  subject_name: '',
  subject_type: 'THEORY',
  credits: 4,
  theory_max_marks: 100,
  theory_marks_obtained: 0,
  practical_max_marks: 0,
  practical_marks_obtained: 0,
};

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export default function StudentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState(defaultSubjectForm);
  const [submittingSubject, setSubmittingSubject] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState(false);

  const { data: student, isLoading, isError, refetch } = useQuery({
    queryKey: ['student', id],
    queryFn: () => fetchStudentById(id ?? ''),
    enabled: !!id,
  });

  const semesters = student?.semesters ?? [];

  const activeSemester = useMemo(() => {
    return semesters.find((semester) => semester.evaluation_status !== 'NOT_EVALUATED') ?? semesters[0] ?? null;
  }, [semesters]);

  const handleSemesterSaved = (semester: Semester) => {
    queryClient.setQueryData(['student', id], (current: any) => {
      if (!current) return current;
      return {
        ...current,
        semesters: [...(current.semesters ?? []), semester],
      };
    });
    setShowSemesterModal(false);
    refetch();
  };

  const handleSubjectSubmit = async (semesterId: string) => {
    if (!semesterId) return;
    setSubmittingSubject(true);

    try {
      const payload = {
        ...subjectForm,
        credits: Number(subjectForm.credits),
        theory_max_marks: Number(subjectForm.theory_max_marks || 100),
        theory_marks_obtained: Number(subjectForm.theory_marks_obtained || 0),
        practical_max_marks: Number(subjectForm.practical_max_marks || 0) || undefined,
        practical_marks_obtained: Number(subjectForm.practical_marks_obtained || 0),
      };

      await apiClient.post(`/semesters/${semesterId}/subjects`, payload);
      toast.success('Subject added.');
      setSubjectForm(defaultSubjectForm);
      refetch();
    } catch (error: any) {
      const message = error?.response?.data?.error?.message ?? 'Unable to add subject.';
      toast.error(message);
    } finally {
      setSubmittingSubject(false);
    }
  };

  const handleAttendanceUpdate = async (semesterId: string, attended: number) => {
    try {
      const totalLectures = safeNumber(student?.semesters?.find((semester) => semester.id === semesterId)?.total_lectures, 100);
      await apiClient.put(`/semesters/${semesterId}/attendance`, {
        total_lectures: totalLectures,
        attended_lectures: attended,
      });
      toast.success('Attendance updated.');
      refetch();
    } catch (error: any) {
      const message = error?.response?.data?.error?.message ?? 'Unable to update attendance.';
      toast.error(message);
    }
  };

  const handleEvaluate = async (semesterId: string) => {
    try {
      setEvaluating(true);
      const { data } = await apiClient.post(`/semesters/${semesterId}/evaluate`, { force: false });
      toast.success(`Semester evaluated. SGPA: ${data.sgpa}`);
      refetch();
    } catch (error: any) {
      const message = error?.response?.data?.error?.message ?? 'Evaluation failed.';
      toast.error(message);
    } finally {
      setEvaluating(false);
    }
  };

  const handleDelete = async () => {
    if (!student) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/students/${student.id}`);
      queryClient.setQueryData(['students'], (current: any[] | undefined) => current?.filter((item) => item.id !== student.id) ?? []);
      toast.success('Student record deleted successfully');
      navigate('/students', { replace: true });
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message ?? 'Unable to delete student record.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSubjectDelete = async () => {
    if (!subjectToDelete) return;
    setDeletingSubject(true);
    try {
      await apiClient.delete(`/semesters/subjects/${subjectToDelete.id}`);
      toast.success('Subject removed. SGPA recalculated.');
      setSubjectToDelete(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message ?? 'Unable to remove subject.');
    } finally {
      setDeletingSubject(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-5">
          <div className="h-10 w-72 rounded-xl bg-slate-800/80" />
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="h-56 rounded-2xl border border-slate-800 bg-slate-900/60" />
            <div className="h-56 rounded-2xl border border-slate-800 bg-slate-900/60" />
          </div>
          <div className="h-72 rounded-2xl border border-slate-800 bg-slate-900/60" />
        </div>
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-2xl rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-rose-100">
          <p className="text-xs uppercase tracking-[0.2em] text-rose-300">Unable to load profile</p>
          <p className="mt-2 text-lg font-semibold">This student record could not be found.</p>
          <p className="mt-2 text-sm text-rose-200/80">The record may have been removed or the details request failed. Return to the directory and try again.</p>
          <button onClick={() => navigate('/students')} className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-sm font-medium text-rose-100 transition hover:bg-rose-400/20">
            <ArrowLeft className="mr-2 inline h-4 w-4" />
            Back to students
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/students')} className="rounded-lg border border-slate-700 bg-slate-900/80 p-2 text-slate-200 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-sky-300">Profile</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{student.full_name}</h1>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Link to={`/students/${student.id}/report`} className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-sky-400/50 hover:text-white">
            View Report Card
          </Link>
          <button
            onClick={() => setShowSemesterModal(true)}
            className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_18px_rgba(14,165,233,0.35)]"
          >
            + Add Semester
          </button>
          <button type="button" onClick={() => setShowDeleteModal(true)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"><Trash2 className="h-4 w-4" /> Delete Student</button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-400/20 text-lg font-semibold text-sky-200">
                  {student.full_name?.slice(0, 1).toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">{student.roll_number ?? 'Unknown roll number'}</p>
                  <p className="text-sm text-slate-400">{student.department ?? 'Department unavailable'} • {student.degree_type ?? 'Degree unavailable'}</p>
                </div>
              </div>
              <StatusBadge label={student.scholarship_status ?? 'GOOD_STANDING'} tone={student.scholarship_status === 'SCHOLARSHIP' ? 'scholarship' : student.scholarship_status === 'PROBATION' ? 'backlog' : 'good'} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">CGPA</p>
                <p className="mt-3 text-3xl font-semibold text-white">{student.cgpa !== null && student.cgpa !== undefined ? safeNumber(student.cgpa).toFixed(2) : '—'}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scholarship</p>
                <p className="mt-3 text-lg font-medium text-sky-200">{student.scholarship_status ?? 'Good Standing'}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Admission</p>
                <p className="mt-3 text-lg font-medium text-white">{student.admission_year ?? '—'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Semester Records</h2>
              <span className="rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-300">{semesters.length} terms</span>
            </div>

            <div className="space-y-4">
              {semesters.length === 0 ? (
                <div className="rounded-xl border border-dashed border-sky-500/30 bg-sky-500/5 p-6 text-slate-300">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-white">No semesters yet</p>
                      <p className="mt-1 text-sm text-slate-400">Create Semester 1 to record attendance, courses, and marks.</p>
                    </div>
                    <button onClick={() => setShowSemesterModal(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-500 px-3.5 py-2.5 text-sm font-semibold text-slate-950">
                      <Plus className="h-4 w-4" /> Add Semester 1
                    </button>
                  </div>
                </div>
              ) : (
                semesters.map((semester) => {
                  const attendance = safeNumber(semester.attendance_percentage, safeNumber(semester.total_lectures) > 0 ? (safeNumber(semester.attended_lectures) / safeNumber(semester.total_lectures)) * 100 : 0);
                  const attendedLectures = safeNumber(semester.attended_lectures);
                  const totalLectures = Math.max(safeNumber(semester.total_lectures), 1);
                  const isDebarred = Boolean(semester.is_debarred);
                  const hasSubjects = (semester.subjects ?? []).length > 0;

                  return (
                    <div key={semester.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm uppercase tracking-[0.2em] text-sky-300">Semester {semester.semester_number}</p>
                          <h3 className="mt-1 text-lg font-semibold text-white">{semester.academic_year}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {isDebarred ? (
                            <StatusBadge label="Debarred" tone="debarred" />
                          ) : (
                            <StatusBadge label={semester.evaluation_status === 'EVALUATED' ? 'Evaluated' : 'In Progress'} tone="good" />
                          )}
                          <button
                            onClick={() => handleEvaluate(semester.id)}
                            disabled={isDebarred || evaluating}
                            className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                          >
                            {evaluating ? 'Evaluating...' : 'Run Evaluation'}
                          </button>
                        </div>
                      </div>

                      <div className="mb-5 grid gap-3 md:grid-cols-4">
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                          <p className="text-xs text-slate-400">Attendance</p>
                          <p className="mt-2 text-xl font-semibold text-white">{attendance.toFixed(2)}%</p>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                          <p className="text-xs text-slate-400">SGPA</p>
                          <p className="mt-2 text-xl font-semibold text-white">{semester.sgpa ?? '—'}</p>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                          <p className="text-xs text-slate-400">Status</p>
                          <p className="mt-2 text-sm font-medium text-slate-200">{semester.evaluation_status}</p>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                          <p className="text-xs text-slate-400">Lectures</p>
                          <p className="mt-2 text-sm font-medium text-slate-200">{attendedLectures}/{totalLectures}</p>
                        </div>
                      </div>

                      {isDebarred && (
                        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-200">
                          <ShieldAlert className="h-4 w-4" />
                          Attendance below minimum threshold. Semester evaluation is disabled until attendance is updated.
                        </div>
                      )}

                      <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-slate-200">Attendance validation</p>
                          <button
                            onClick={() => handleAttendanceUpdate(semester.id, Math.min(semester.attended_lectures + 5, semester.total_lectures))}
                            className="rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-200"
                          >
                            +5% mark
                          </button>
                        </div>
                          <input
                          type="range"
                          min={0}
                            max={totalLectures}
                            value={Math.min(attendedLectures, totalLectures)}
                          onChange={(event) => handleAttendanceUpdate(semester.id, Number(event.target.value))}
                          className="w-full accent-sky-500"
                        />
                        <div className="mt-2 flex justify-between text-xs text-slate-400">
                          <span>0</span>
                          <span>{attendedLectures} / {totalLectures}</span>
                          <span>{totalLectures}</span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h4 className="text-base font-semibold text-white">Subject Marks</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <BookOpen className="h-3.5 w-3.5" />
                            {hasSubjects ? `${(semester.subjects ?? []).length} subjects` : 'No subjects'}
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          {(semester.subjects ?? []).length === 0 ? (
                            <div className="md:col-span-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-400">
                              Add marks for this semester to compute SGPA and backlog status.
                            </div>
                          ) : (
                            (semester.subjects ?? []).map((subject: Subject) => (
                              <div key={subject.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <p className="font-medium text-white">{subject.subject_name}</p>
                                  <div className="flex items-center gap-2"><span className="rounded-full border border-slate-700 bg-slate-950/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-slate-300">{subject.subject_type}</span><button type="button" onClick={() => setSubjectToEdit(subject)} aria-label={`Edit ${subject.subject_name}`} className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-1.5 text-cyan-300 transition hover:bg-cyan-500/20"><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setSubjectToDelete(subject)} aria-label={`Remove ${subject.subject_name}`} className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-300 transition hover:bg-rose-500/20"><Trash2 className="h-3.5 w-3.5" /></button></div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                  <span>{subject.subject_code}</span>
                                    <span>{safeNumber(subject.credits)} credits</span>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                                    <p className="text-slate-400">Marks</p>
                                    <p className="mt-1 font-medium text-white">{safeNumber(subject.total_marks_obtained)}</p>
                                  </div>
                                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                                    <p className="text-slate-400">Grade</p>
                                    <p className="mt-1 font-medium text-white">{subject.grade_letter ?? '—'}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                            <Plus className="h-4 w-4 text-sky-300" />
                            Add Subject
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            <input
                              value={subjectForm.subject_code}
                              onChange={(event) => setSubjectForm((current) => ({ ...current, subject_code: event.target.value }))}
                              className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
                              placeholder="CS101"
                            />
                            <input
                              value={subjectForm.subject_name}
                              onChange={(event) => setSubjectForm((current) => ({ ...current, subject_name: event.target.value }))}
                              className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
                              placeholder="Algorithm Design"
                            />
                            <select
                              value={subjectForm.subject_type}
                              onChange={(event) => setSubjectForm((current) => ({ ...current, subject_type: event.target.value as typeof current.subject_type }))}
                              className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
                            >
                              <option value="THEORY">THEORY</option>
                              <option value="LAB">LAB</option>
                              <option value="THESIS">THESIS</option>
                              <option value="PRESENTATION">PRESENTATION</option>
                            </select>
                            <input
                              type="number"
                              min={1}
                              value={subjectForm.credits}
                              onChange={(event) => setSubjectForm((current) => ({ ...current, credits: Number(event.target.value) }))}
                              className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
                              placeholder="Credits"
                            />
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={subjectForm.theory_marks_obtained}
                              onChange={(event) => setSubjectForm((current) => ({ ...current, theory_marks_obtained: Number(event.target.value) }))}
                              className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
                              placeholder="Theory marks"
                            />
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={subjectForm.practical_marks_obtained}
                              onChange={(event) => setSubjectForm((current) => ({ ...current, practical_marks_obtained: Number(event.target.value) }))}
                              className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
                              placeholder="Practical marks"
                            />
                            <SubjectEditModal subject={subjectToEdit} onClose={() => setSubjectToEdit(null)} onSaved={() => { setSubjectToEdit(null); refetch(); }} />
                            <ConfirmModal open={Boolean(subjectToDelete)} studentName={subjectToDelete ? `${subjectToDelete.subject_name}? Marks will be deleted and SGPA will update.` : ''} submitting={deletingSubject} onClose={() => !deletingSubject && setSubjectToDelete(null)} onConfirm={handleSubjectDelete} />
                          </div>

                          <button
                            onClick={() => handleSubjectSubmit(semester.id)}
                            disabled={submittingSubject || !subjectForm.subject_code || !subjectForm.subject_name}
                            className="mt-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-3.5 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {submittingSubject ? 'Saving...' : 'Save Subject'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Academic Snapshot</h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Current SGPA</span>
                  <TrendingUp className="h-4 w-4 text-sky-300" />
                </div>
                <p className="mt-3 text-3xl font-semibold text-white">{activeSemester?.sgpa !== null && activeSemester?.sgpa !== undefined ? safeNumber(activeSemester.sgpa).toFixed(2) : '—'}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Attendance Gate</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                </div>
                <p className="mt-3 text-lg font-medium text-white">{activeSemester ? `${safeNumber(activeSemester.attendance_percentage, safeNumber(activeSemester.total_lectures) > 0 ? (safeNumber(activeSemester.attended_lectures) / safeNumber(activeSemester.total_lectures)) * 100 : 0).toFixed(2)}%` : '—'}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Backlog Status</span>
                  <GraduationCap className="h-4 w-4 text-amber-300" />
                </div>
                <p className="mt-3 text-lg font-medium text-white">{(activeSemester?.subjects ?? []).some((item: Subject) => item.is_backlog) ? 'Active backlog' : 'Clear'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center gap-2 text-sky-300">
              <Sparkles className="h-4 w-4" />
              <h2 className="text-lg font-semibold text-white">Performance Insights</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">Track attendance threshold compliance before evaluation.</li>
              <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">Flag backlog subjects automatically using the grade engine.</li>
              <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">Scholarship eligibility updates as soon as CGPA recalculates.</li>
            </ul>
          </div>
        </aside>
      </div>

      <SemesterModal
        open={showSemesterModal}
        studentId={student.id}
        onClose={() => setShowSemesterModal(false)}
        onSaved={handleSemesterSaved}
      />
      <ConfirmModal open={showDeleteModal} studentName={student.full_name} submitting={deleting} onClose={() => !deleting && setShowDeleteModal(false)} onConfirm={handleDelete} />
    </div>
  );
}
