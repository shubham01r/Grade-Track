import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, CheckCircle2, Eye, EyeOff, GraduationCap, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { AmbientBackground } from '../components/AmbientBackground';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const fillDemoCredentials = () => {
    setEmail('admin@gradetrack.local');
    setPassword('Password123!');
    toast.success('Demo admin credentials filled.');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await login(email, password);
      const nextPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';
      navigate(nextPath, { replace: true });
      toast.success('Welcome back to GradeTrack');
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message ?? 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-theme relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 px-4 py-6 text-slate-100 sm:px-8 lg:px-12">
      <AmbientBackground dark />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]"
      >
        <section className="hidden px-4 lg:block">
          <div className="mb-10 flex items-center gap-5">
            <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-sky-400/10 shadow-[0_0_30px_rgba(56,189,248,0.22)] ring-1 ring-sky-300/40">
              <img src="/logo.png" alt="GradeTrack logo" className="h-24 w-24 rounded-2xl object-contain drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-sky-300">Academic operations</p>
              <h1 className="mt-1 text-4xl font-semibold tracking-tight text-white">GradeTrack</h1>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="mb-4 flex items-center gap-2 text-sm font-medium text-indigo-200"><Sparkles className="h-4 w-4 text-sky-300" /> Clarity for every academic decision</p>
            <h2 className="text-5xl font-semibold leading-[1.08] tracking-tight text-white">The academic record, made actionable.</h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">A focused command center for evaluating performance, protecting attendance compliance, and recognizing student momentum.</p>
          </div>

          <div className="mt-9 space-y-3">
            {[
              { icon: BarChart3, title: 'Automated SGPA / CGPA evaluation', text: 'Turn subject marks into clear academic outcomes.' },
              { icon: ShieldCheck, title: 'Attendance gatekeeper', text: 'Real-time 75% threshold checks with debarment alerts.' },
              { icon: GraduationCap, title: 'Merit and transcript ready', text: 'Rank cohorts and produce print-ready academic records.' },
            ].map(({ icon: Icon, title, text }, index) => (
              <motion.div key={title} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + index * 0.08 }} className="flex max-w-lg items-center gap-4 rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4 backdrop-blur-sm">
                <div className="rounded-xl bg-sky-500/10 p-2.5 text-sky-300 ring-1 ring-sky-400/20"><Icon className="h-5 w-5" /></div>
                <div><p className="font-medium text-white">{title}</p><p className="mt-1 text-sm text-slate-400">{text}</p></div>
              </motion.div>
            ))}
          </div>

          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-xs font-medium text-indigo-100"><CheckCircle2 className="h-4 w-4 text-sky-300" /> UG &amp; PG grading strategies supported</div>
        </section>

        <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.35 }} className="mx-auto w-full max-w-md rounded-3xl border border-slate-700/80 bg-slate-900/70 p-6 shadow-[0_0_55px_rgba(14,165,233,0.16)] backdrop-blur-2xl sm:p-9">
          <div className="mb-8 lg:hidden">
            <div className="mb-6 flex flex-col items-start gap-3"><div className="rounded-2xl bg-sky-400/10 p-2 ring-1 ring-sky-300/40"><img src="/logo.png" alt="GradeTrack logo" className="h-24 w-24 rounded-xl object-contain drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]" /></div><h1 className="text-2xl font-semibold text-white">GradeTrack</h1></div>
          </div>
          <div className="mb-7">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-300">Admin portal</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Welcome Back</h2>
            <p className="mt-2 text-sm text-slate-400">Sign in to academic admin portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
              Email
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/65 px-3 py-3 transition focus-within:border-sky-400/50 focus-within:ring-2 focus-within:ring-sky-500/20">
              <Mail className="h-4 w-4 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                placeholder="admin@gradetrack.local"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
              Password
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/65 px-3 py-3 transition focus-within:border-sky-400/50 focus-within:ring-2 focus-within:ring-sky-500/20">
              <LockKeyhole className="h-4 w-4 text-slate-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                placeholder="Enter your password"
                required
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-slate-400 transition hover:text-sky-300" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="button" onClick={fillDemoCredentials} className="w-full text-right text-xs font-medium text-sky-300 transition hover:text-sky-200">Auto-fill Demo Admin</button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.35)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" /> : <ArrowRight className="h-4 w-4" />}
            {isSubmitting ? 'Signing in...' : 'Sign in securely'}
          </button>
        </form>
          <p className="mt-6 text-center text-xs text-slate-500">Protected academic records. Authorized administrators only.</p>
        </motion.section>
      </motion.main>
    </div>
  );
}
