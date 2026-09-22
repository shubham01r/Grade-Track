import { motion } from 'framer-motion';

export function AmbientBackground({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className={`absolute -left-24 -top-24 h-72 w-72 rounded-full ${dark ? 'bg-cyan-400/20' : 'bg-cyan-300/35'} blur-3xl will-change-transform`}
        animate={{ x: [0, 28, -8, 0], y: [0, 20, 44, 0], scale: [1, 1.08, 0.94, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={`absolute right-[-8rem] top-1/3 h-96 w-96 rounded-full ${dark ? 'bg-indigo-500/20' : 'bg-indigo-300/30'} blur-3xl will-change-transform`}
        animate={{ x: [0, -32, 0], y: [0, 30, -18, 0], scale: [1, 0.94, 1.08, 1] }}
        transition={{ duration: 23, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className={`absolute bottom-[-10rem] left-1/3 h-80 w-80 rounded-full ${dark ? 'bg-violet-500/15' : 'bg-violet-300/25'} blur-3xl will-change-transform`}
        animate={{ x: [0, 22, -20, 0], y: [0, -22, -5, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <div className={`absolute inset-0 ${compact ? 'opacity-[0.06]' : 'opacity-[0.08]'} [background-image:linear-gradient(rgba(148,163,184,0.38)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.38)_1px,transparent_1px)] [background-size:44px_44px]`} />
      <div className={`absolute inset-0 ${dark ? 'bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(2,6,23,0.42)_100%)]' : 'bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(226,232,240,0.42)_100%)]'}`} />
    </div>
  );
}
