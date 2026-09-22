import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export function ConfirmModal({
  open,
  studentName,
  submitting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  studentName: string;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }} className="glass-panel w-full max-w-md rounded-3xl border-rose-200/70 bg-white/95 p-6 shadow-2xl shadow-rose-200/40 dark:border-rose-500/30 dark:bg-slate-900/95">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-rose-100 p-3 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"><AlertTriangle className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600 dark:text-rose-300">Permanent action</p><h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Delete student?</h2></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button></div>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{studentName}</strong>? This will permanently erase their academic records, attendance, and transcripts.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">Cancel</button><button type="button" onClick={onConfirm} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 disabled:opacity-60"><Trash2 className="h-4 w-4" />{submitting ? 'Deleting...' : 'Delete Student'}</button></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
