type Tone = 'scholarship' | 'backlog' | 'debarred' | 'good';

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  const styles: Record<Tone, string> = {
    scholarship: 'border border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300',
    backlog: 'border border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300',
    debarred: 'border border-rose-500/30 bg-rose-500/15 text-rose-700 dark:text-rose-300',
    good: 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${styles[tone]}`}>
      {label}
    </span>
  );
}
