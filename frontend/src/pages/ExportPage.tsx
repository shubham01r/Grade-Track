import { Download, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import apiClient from '../api/client';

export default function ExportPage() {
  const [department, setDepartment] = useState('');
  const [degree, setDegree] = useState('');
  const [batch, setBatch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      const params = new URLSearchParams();
      if (department) params.set('dept', department);
      if (degree) params.set('degree', degree);
      if (batch) params.set('batch', batch);
      if (studentId) params.set('studentId', studentId);

      const response = await apiClient.get(`/export/csv${params.toString() ? `?${params.toString()}` : ''}`, {
        responseType: 'blob',
      });
      const blobUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'gradetrack-export.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      toast.success('CSV export downloaded.');
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message ?? 'Unable to export records.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.22em] text-sky-300">Data</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Export Center</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Download a CSV of academic records using the filters below.</p>
      </div>

      <div className="max-w-4xl rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-[0_0_25px_rgba(15,23,42,0.55)]">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-sky-500/10 p-3 text-sky-300 ring-1 ring-sky-400/30">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Student records</h2>
            <p className="text-sm text-slate-400">Leave filters empty to export every student.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            Department
            <select value={department} onChange={(event) => setDepartment(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-white outline-none focus:border-sky-400">
              <option value="">All departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Business Administration">Business Administration</option>
              <option value="Information Technology">Information Technology</option>
            </select>
          </label>

          <label className="text-sm text-slate-300">
            Degree type
            <select value={degree} onChange={(event) => setDegree(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-white outline-none focus:border-sky-400">
              <option value="">All degree types</option>
              <option value="UG">UG</option>
              <option value="PG">PG</option>
            </select>
          </label>

          <label className="text-sm text-slate-300">
            Admission year
            <input value={batch} onChange={(event) => setBatch(event.target.value)} type="number" min="2000" placeholder="2025" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-white outline-none focus:border-sky-400" />
          </label>

          <label className="text-sm text-slate-300">
            Student ID <span className="text-slate-500">(optional)</span>
            <input value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="Specific student UUID" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-white outline-none focus:border-sky-400" />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_18px_rgba(14,165,233,0.35)] disabled:cursor-not-allowed disabled:opacity-60">
            <Download className="h-4 w-4" />
            {exporting ? 'Preparing CSV...' : 'Export CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
