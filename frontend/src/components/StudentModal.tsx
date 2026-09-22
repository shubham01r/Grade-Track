import { AnimatePresence, motion } from 'framer-motion';
import { Check, GraduationCap, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import apiClient from '../api/client';
import type { Student } from '../types/student';

export function StudentModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (student: Student) => void;
}) {
  const [rollNumber, setRollNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [degreeType, setDegreeType] = useState<'UG' | 'PG'>('UG');
  const [admissionYear, setAdmissionYear] = useState(new Date().getFullYear());
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const { data } = await apiClient.post('/students', {
        roll_number: rollNumber,
        full_name: fullName,
        department,
        degree_type: degreeType,
        admission_year: Number(admissionYear),
      });

      toast.success('Student created successfully.');
      onSaved(data);
      onClose();
      setRollNumber('');
      setFullName('');
      setDepartment('Computer Science');
      setDegreeType('UG');
      setAdmissionYear(new Date().getFullYear());
    } catch (err: any) {
      const message = err?.response?.data?.error?.message ?? 'Unable to create student.';
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
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.2 }}
            className="glass-panel max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border-cyan-400/20 bg-slate-900/85 p-6 shadow-[0_0_55px_rgba(6,182,212,0.16)] sm:p-7"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-400/10 p-2.5 text-cyan-200 ring-1 ring-cyan-400/20"><GraduationCap className="h-5 w-5" /></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Enrollment</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Add Student</h2>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:border-cyan-400/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-300">Roll Number</label>
                  <input
                    value={rollNumber}
                    onChange={(event) => setRollNumber(event.target.value)}
                    className={`w-full rounded-xl border bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition focus:bg-cyan-400/5 ${error ? 'border-rose-500' : 'border-white/10 focus:border-cyan-400/60'}`}
                    placeholder="GT-2025-001"
                    required
                  />
                  {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-300">Full Name</label>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-cyan-400/5"
                    placeholder="Student name"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Department</label>
                  <select
                    value={department}
                    onChange={(event) => setDepartment(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-cyan-400/5"
                  >
                    <option>Computer Science</option>
                    <option>Electronics</option>
                    <option>Mechanical</option>
                    <option>Business Administration</option>
                    <option>Information Technology</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Degree Type</label>
                  <div className="flex gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1">
                    {(['UG', 'PG'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDegreeType(type)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${degreeType === type ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-300 hover:bg-white/5'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-300">Batch / Admission Year</label>
                  <input
                    type="number"
                    value={admissionYear}
                    onChange={(event) => setAdmissionYear(Number(event.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-cyan-400/5"
                    min={2000}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(6,182,212,0.25)] transition hover:-translate-y-0.5 disabled:opacity-70">
                  {submitting ? 'Saving...' : <><Check className="h-4 w-4" />Create Student</>}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
