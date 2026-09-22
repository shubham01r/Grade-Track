import { AnimatePresence, motion } from 'framer-motion';
import { Check, Pencil, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import apiClient from '../api/client';
import type { Subject } from '../types/student';

export function SubjectEditModal({ subject, onClose, onSaved }: { subject: Subject | null; onClose: () => void; onSaved: () => void }) {
  const [code, setCode] = useState(subject?.subject_code ?? '');
  const [name, setName] = useState(subject?.subject_name ?? '');
  const [credits, setCredits] = useState(String(subject?.credits ?? ''));
  const [type, setType] = useState<Subject['subject_type']>(subject?.subject_type ?? 'THEORY');
  const [internal, setInternal] = useState('');
  const [external, setExternal] = useState(subject?.total_marks_obtained == null ? '' : String(subject.total_marks_obtained));
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const markValues = [internal, external].filter((value) => value !== '').map(Number);
    if (markValues.some((value) => value < 0 || value > 100)) {
      toast.error('Marks cannot exceed 100');
      setSaving(false);
      return;
    }

    const payload: Record<string, unknown> = {};
    if (code.trim()) payload.subject_code = code.trim();
    if (name.trim()) payload.subject_name = name.trim();
    if (credits !== '') payload.credits = Number(credits);
    if (type) payload.subject_type = type;
    if (markValues.length > 0) payload.theory_marks_obtained = markValues.reduce((sum, value) => sum + value, 0);
    if (Object.keys(payload).length === 0) {
      toast.error('Enter at least one change before saving.');
      setSaving(false);
      return;
    }

    try {
      await apiClient.put(`/semesters/subjects/${subject?.id}`, payload);
      toast.success('Subject and marks updated. SGPA recalculated.');
      onSaved();
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message ?? 'Unable to update subject.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {subject && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-md">
          <motion.form onSubmit={submit} initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass-panel w-full max-w-lg rounded-3xl bg-white/95 p-6 dark:bg-slate-900/95">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300"><Pencil className="h-4 w-4" /></div><div><p className="text-xs uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">Subject editor</p><h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Edit Subject &amp; Marks</h2></div></div>
              <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Course code" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Subject name" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
              <input type="number" min={1} value={credits} onChange={(event) => setCredits(event.target.value)} placeholder="Credits" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
              <select value={type} onChange={(event) => setType(event.target.value as Subject['subject_type'])} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><option className="bg-slate-900 text-slate-100" value="THEORY">Theory</option><option className="bg-slate-900 text-slate-100" value="LAB">Practical / Lab</option><option className="bg-slate-900 text-slate-100" value="THESIS">Thesis</option><option className="bg-slate-900 text-slate-100" value="PRESENTATION">Presentation</option></select>
              <input type="number" min={0} max={100} value={internal} onChange={(event) => setInternal(event.target.value)} placeholder="Internal marks / 100" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
              <input type="number" min={0} max={100} value={external} onChange={(event) => setExternal(event.target.value)} placeholder="External / End-sem marks / 100" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60"><Check className="h-4 w-4" />{saving ? 'Saving...' : 'Save Changes'}</button></div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
