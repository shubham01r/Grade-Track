import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Medal, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import type { Student } from '../types/student';

function backlogCount(student: Student) {
  return (student.semesters ?? []).reduce((total, semester) => total + (semester.subjects ?? []).filter((subject) => subject.is_backlog).length, 0);
}

function rankStyle(rank: number) {
  if (rank === 1) return 'bg-amber-400 text-slate-950';
  if (rank === 2) return 'bg-slate-300 text-slate-950';
  if (rank === 3) return 'bg-orange-500 text-slate-950';
  return 'border border-slate-700 bg-slate-950 text-slate-300';
}

export default function LeaderboardPage() {
  const [department, setDepartment] = useState('');
  const [degree, setDegree] = useState('');
  const [batch, setBatch] = useState('');
  const [showUnranked, setShowUnranked] = useState(false);

  const { data: students = [], isLoading, isError } = useQuery({
    queryKey: ['leaderboard', department, degree, batch],
    queryFn: async () => {
      const { data } = await apiClient.get('/leaderboard', { params: { dept: department, degree, batch } });
      return data as Student[];
    },
  });

  const { data: allStudents = [] } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data } = await apiClient.get('/students');
      return data as Student[];
    },
  });

  const ranked = useMemo(() => {
    return [...students].sort((a, b) => (Number(b.cgpa ?? 0) - Number(a.cgpa ?? 0)) || (backlogCount(a) - backlogCount(b)) || a.full_name.localeCompare(b.full_name));
  }, [students]);

  const unranked = useMemo(() => {
    return allStudents.filter((student) => !student.cgpa).filter((student) => (!department || student.department === department) && (!degree || student.degree_type === degree) && (!batch || String(student.admission_year) === batch));
  }, [allStudents, department, degree, batch]);

  return (
    <div className="p-8">
      <div className="mb-6"><p className="text-sm uppercase tracking-[0.22em] text-sky-300">Rankings</p><h1 className="mt-2 text-3xl font-semibold text-white">Leaderboard</h1><p className="mt-2 text-sm text-slate-400">Compare evaluated performance by batch and programme.</p></div>

      <div className="mb-5 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-3">
        <select value={department} onChange={(event) => setDepartment(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none"><option value="">All Departments</option><option value="Computer Science">Computer Science</option><option value="Electronics">Electronics</option><option value="Mechanical">Mechanical</option><option value="Business Administration">Business Administration</option><option value="Information Technology">Information Technology</option></select>
        <select value={degree} onChange={(event) => setDegree(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none"><option value="">All Degree Types</option><option value="UG">UG</option><option value="PG">PG</option></select>
        <input value={batch} onChange={(event) => setBatch(event.target.value)} type="number" placeholder="Admission Year" className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500" />
      </div>

      {isLoading && <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-300">Loading rankings...</div>}
      {isError && <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-red-200">Unable to load leaderboard data.</div>}
      {!isLoading && !isError && <>
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
          <div className="mb-4 flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-300" /><h2 className="text-lg font-semibold text-white">Ranked Students</h2></div>
          {ranked.length === 0 ? <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">No evaluated students match these filters.</div> : <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50"><table className="min-w-full text-left text-sm text-slate-200"><thead className="bg-slate-900/80 text-slate-300"><tr><th className="px-4 py-3">Rank</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Roll No.</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">CGPA</th><th className="px-4 py-3">Backlogs</th></tr></thead><tbody>{ranked.map((student, index) => <tr key={student.id} className="border-t border-slate-800/80 transition hover:bg-slate-900/70"><td className="px-4 py-3"><span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${rankStyle(index + 1)}`}>{index + 1}</span></td><td className="px-4 py-3 font-medium text-white"><Link to={`/students/${student.id}/report`} className="hover:text-sky-300">{student.full_name}</Link></td><td className="px-4 py-3">{student.roll_number}</td><td className="px-4 py-3">{student.department}</td><td className="px-4 py-3 font-semibold text-sky-200">{student.cgpa}</td><td className="px-4 py-3">{backlogCount(student)}</td></tr>)}</tbody></table></div>}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <button onClick={() => setShowUnranked((value) => !value)} className="flex w-full items-center justify-between text-left"><span className="flex items-center gap-2 text-base font-semibold text-white"><Medal className="h-4 w-4 text-slate-400" />Not Yet Ranked <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-400">{unranked.length}</span></span>{showUnranked ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}</button>
          {showUnranked && <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50"><table className="min-w-full text-left text-sm text-slate-200"><thead className="bg-slate-900/80 text-slate-300"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Roll No.</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Reason</th></tr></thead><tbody>{unranked.length === 0 ? <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No unranked students in this filter.</td></tr> : unranked.map((student) => <tr key={student.id} className="border-t border-slate-800/80"><td className="px-4 py-3 font-medium text-white">{student.full_name}</td><td className="px-4 py-3">{student.roll_number}</td><td className="px-4 py-3">{student.department}</td><td className="px-4 py-3 text-amber-300">Debarred / Incomplete</td></tr>)}</tbody></table></div>}
        </div>
      </>}
    </div>
  );
}
