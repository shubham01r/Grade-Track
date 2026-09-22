import { useQuery } from '@tanstack/react-query';
import { Save, Settings2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import apiClient from '../api/client';

type GradeRow = { id?: string; marks_min: number; marks_max: number; grade_letter: string; grade_point: number };

const fallbackGradeScale: GradeRow[] = [
  { marks_min: 90, marks_max: 100, grade_letter: 'O', grade_point: 10 },
  { marks_min: 80, marks_max: 89, grade_letter: 'A+', grade_point: 9 },
  { marks_min: 70, marks_max: 79, grade_letter: 'A', grade_point: 8 },
  { marks_min: 60, marks_max: 69, grade_letter: 'B', grade_point: 7 },
  { marks_min: 50, marks_max: 59, grade_letter: 'C', grade_point: 6 },
  { marks_min: 40, marks_max: 49, grade_letter: 'D', grade_point: 5 },
  { marks_min: 0, marks_max: 39, grade_letter: 'F', grade_point: 0 },
];

export default function SettingsPage() {
  const thresholdQuery = useQuery({ queryKey: ['settings', 'attendance'], queryFn: async () => (await apiClient.get('/settings/attendance-threshold')).data });
  const gradeQuery = useQuery({ queryKey: ['settings', 'grade-scale'], queryFn: async () => (await apiClient.get('/settings/grade-scale')).data as GradeRow[] });
  const [threshold, setThreshold] = useState(75);
  const [gradeScale, setGradeScale] = useState<GradeRow[]>(fallbackGradeScale);
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);

  useEffect(() => {
    if (thresholdQuery.data?.attendance_threshold_percent !== undefined) setThreshold(thresholdQuery.data.attendance_threshold_percent);
  }, [thresholdQuery.data]);

  useEffect(() => {
    if (gradeQuery.data?.length) setGradeScale(gradeQuery.data);
  }, [gradeQuery.data]);

  const updateGrade = (index: number, field: keyof GradeRow, value: string) => {
    setGradeScale((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: field === 'grade_letter' ? value : Number(value) } : row));
  };

  const saveThreshold = async () => {
    setSavingThreshold(true);
    try {
      await apiClient.put('/settings/attendance-threshold', { attendance_threshold_percent: Number(threshold) });
      toast.success('Attendance threshold saved.');
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message ?? 'Unable to save attendance threshold.');
    } finally {
      setSavingThreshold(false);
    }
  };

  const saveGrades = async () => {
    setSavingGrades(true);
    try {
      await apiClient.put('/settings/grade-scale', gradeScale.map(({ marks_min, marks_max, grade_letter, grade_point }) => ({ marks_min: Number(marks_min), marks_max: Number(marks_max), grade_letter, grade_point: Number(grade_point) })));
      toast.success('Grade scale saved.');
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message ?? 'Unable to save grade scale.');
    } finally {
      setSavingGrades(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-sky-500/10 p-3 text-sky-300 ring-1 ring-sky-400/30"><Settings2 className="h-5 w-5" /></div>
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-sky-300">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Settings</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-[0_0_25px_rgba(15,23,42,0.55)]">
          <h2 className="text-lg font-semibold text-white">Attendance Threshold</h2>
          <p className="mt-2 text-sm text-slate-400">Students below this percentage are debarred from evaluation.</p>
          <div className="mt-5 flex items-end gap-3">
            <label className="flex-1 text-sm text-slate-300">
              Minimum percentage
              <input type="number" min="0" max="100" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-white outline-none focus:border-sky-400" />
            </label>
            <span className="pb-3 text-slate-400">%</span>
          </div>
          <button onClick={saveThreshold} disabled={savingThreshold} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"><Save className="h-4 w-4" />{savingThreshold ? 'Saving...' : 'Save threshold'}</button>
        </section>

        <section className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-[0_0_25px_rgba(15,23,42,0.55)] lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Grade Scale</h2>
              <p className="mt-1 text-sm text-slate-400">Configure marks ranges and grade points used during evaluation.</p>
            </div>
            <button onClick={saveGrades} disabled={savingGrades} className="inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-200 disabled:opacity-60"><Save className="h-4 w-4" />{savingGrades ? 'Saving...' : 'Save scale'}</button>
          </div>
          <div className="mt-5 space-y-2">
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-3 px-3 text-xs uppercase tracking-[0.14em] text-slate-500"><span>Minimum</span><span>Maximum</span><span>Grade</span><span>Point</span></div>
            {gradeScale.map((row, index) => (
              <div key={`${row.grade_letter}-${index}`} className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                {(['marks_min', 'marks_max', 'grade_letter', 'grade_point'] as const).map((field) => <input key={field} value={row[field]} onChange={(event) => updateGrade(index, field, event.target.value)} className="min-w-0 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-white outline-none focus:border-sky-400" />)}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
