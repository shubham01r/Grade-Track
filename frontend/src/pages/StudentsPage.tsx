import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Filter, Plus, Search, Trash2, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '../api/client';
import { ConfirmModal } from '../components/ConfirmModal';
import { StudentModal } from '../components/StudentModal';
import { StatusBadge } from '../components/StatusBadge';
import { useStudents } from '../hooks/useStudents';
import type { Student } from '../types/student';

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [degree, setDegree] = useState('All');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: students = [], isLoading, isError, error, refetch } = useStudents();

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = !search || `${student.full_name} ${student.roll_number}`.toLowerCase().includes(search.toLowerCase());
      const matchesDepartment = department === 'All' || student.department === department;
      const matchesDegree = degree === 'All' || student.degree_type === degree;
      return matchesSearch && matchesDepartment && matchesDegree;
    });
  }, [students, search, department, degree]);

  const handleStudentSaved = (student: Student) => {
    queryClient.setQueryData(['students'], (current: Student[] | undefined) => {
      if (!current) return [student];
      return [student, ...current];
    });
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/students/${studentToDelete.id}`);
      queryClient.setQueryData(['students'], (current: Student[] | undefined) => current?.filter((student) => student.id !== studentToDelete.id) ?? []);
      toast.success('Student record deleted successfully');
      setStudentToDelete(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message ?? 'Unable to delete student record.');
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-slate-200">Loading students...</div>;
  }

  if (isError) {
    const responseMessage = (error as any)?.response?.data?.error?.message;
    const errorMessage = responseMessage ?? (error as Error)?.message ?? 'The backend did not return student records.';

    return (
      <div className="mx-auto max-w-2xl p-8">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-xl shadow-rose-100/50 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">Student directory unavailable</p>
          <h1 className="mt-2 text-xl font-semibold">Unable to load student records</h1>
          <p className="mt-2 text-sm opacity-80">{errorMessage}</p>
          <button type="button" onClick={() => refetch()} className="mt-5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition hover:-translate-y-0.5 hover:bg-rose-700">
            Retry Loading Students
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] p-5 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-cyan-300"><UserRound className="h-4 w-4" /> Academic directory</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Students</h1>
          <p className="mt-2 text-sm text-slate-400">Manage enrollment, performance, and academic standing.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/15 transition duration-300 hover:-translate-y-0.5 hover:shadow-cyan-500/25"
        >
          <Plus className="h-4 w-4" />
          New Student
        </button>
      </div>

      <div className="glass-panel mb-6 rounded-3xl p-4 shadow-xl shadow-black/10">
        <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500"><Filter className="h-3.5 w-3.5" /> Refine directory</div>
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.7fr_0.7fr]">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 transition focus-within:border-cyan-400/50 focus-within:bg-cyan-400/5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or roll number"
              className="w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>

          <select
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
          >
            <option value="All">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electronics">Electronics</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Business Administration">Business Administration</option>
            <option value="Information Technology">Information Technology</option>
          </select>

          <select
            value={degree}
            onChange={(event) => setDegree(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
          >
            <option value="All">All Degrees</option>
            <option value="UG">UG</option>
            <option value="PG">PG</option>
          </select>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-3 shadow-xl shadow-black/10 sm:p-4">
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/30">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-white/[0.05] text-xs uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Roll No.</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Degree</th>
                <th className="px-4 py-3">CGPA</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    No student records match your filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const badgeTone = student.scholarship_status === 'SCHOLARSHIP' ? 'scholarship' : student.scholarship_status === 'PROBATION' ? 'backlog' : 'good';

                  return (
                    <tr key={student.id} className="border-t border-white/[0.06] transition duration-300 hover:bg-cyan-400/[0.04]">
                      <td className="px-4 py-3 font-medium text-white">{student.roll_number}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/15 to-violet-400/15 text-cyan-200 ring-1 ring-cyan-400/20">
                            <UserRound className="h-4 w-4" />
                          </div>
                          <span>{student.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{student.department}</td>
                      <td className="px-4 py-3">{student.degree_type}</td>
                      <td className="px-4 py-3">{student.cgpa ?? '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge label={student.scholarship_status ?? 'GOOD_STANDING'} tone={badgeTone} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                        <Link to={`/students/${student.id}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-cyan-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-white">
                          View
                        </Link>
                        <button type="button" onClick={() => setStudentToDelete(student)} aria-label={`Delete ${student.full_name}`} title="Delete student" className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/20"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StudentModal open={showModal} onClose={() => setShowModal(false)} onSaved={handleStudentSaved} />
      <ConfirmModal open={Boolean(studentToDelete)} studentName={studentToDelete?.full_name ?? ''} submitting={deleting} onClose={() => !deleting && setStudentToDelete(null)} onConfirm={handleDelete} />
    </div>
  );
}
