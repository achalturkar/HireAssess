'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ReportPageProps {
  params: {
    id: string;
  };
}

export default function ResultReportPage({ params }: ReportPageProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-8 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#3FDCC0]">Candidate report</p>
          <h1 className="text-[28px] font-semibold text-[#F2F4FA]" style={{ fontFamily: 'var(--font-display)' }}>
            Printable report placeholder
          </h1>
          <p className="text-[13.5px] text-[#8891B8] mt-2">Report for attempt {params.id}</p>
        </div>
        <Link
          href={`/company/results/${params.id}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#161C3A] px-4 py-2 text-[12.5px] font-semibold text-[#F2F4FA] hover:border-[#3FDCC0]/60"
        >
          <ArrowLeft size={16} /> Back to result
        </Link>
      </div>

      <div className="rounded-3xl border border-white/[0.08] bg-[#10152A] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.17)]">
        <div className="aspect-[11/8.5] w-full overflow-hidden rounded-3xl border border-white/[0.06] bg-white p-8 text-[#0F172A] shadow-lg">
          <div className="h-full rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6">
            <h2 className="text-[18px] font-semibold text-slate-900">HireAssess Candidate Report</h2>
            <p className="mt-3 text-[13px] text-slate-600">This page is a placeholder for the printable A4-style report. The final report will include candidate details, assessment scores, trait insights, and question analysis.</p>
            <div className="mt-8 grid gap-4 text-[12.5px] text-slate-500">
              <div className="rounded-2xl bg-slate-100 p-4">Candidate metadata and report summary will render here.</div>
              <div className="rounded-2xl bg-slate-100 p-4">Score breakdown and behavioral insights will appear in a clean report layout.</div>
              <div className="rounded-2xl bg-slate-100 p-4">Include branding, page-numbering, and printable margins for PDF export.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
