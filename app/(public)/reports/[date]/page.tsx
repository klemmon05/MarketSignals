import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EmailReportForm } from '@/components/email-report-form';

export default async function ReportDatePage({ params }: { params: { date: string } }) {
  const supabase = createClient();
  const { data: report } = await supabase
    .from('reports')
    .select('id,report_date,title,parsed_json')
    .eq('report_date', params.date)
    .eq('is_published', true)
    .eq('visibility', 'public')
    .maybeSingle();

  if (!report) notFound();

  const parsed = report.parsed_json as any;

  const { data: archive } = await supabase
    .from('reports')
    .select('report_date')
    .eq('is_published', true)
    .eq('visibility', 'public')
    .order('report_date', { ascending: false })
    .limit(30);

  return (
    <article className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-xs uppercase tracking-wider text-slate-500">Published report</p>
        <h1 className="mt-1 text-2xl font-semibold">{report.title}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/api/reports/${params.date}/pdf`} className="rounded-md border px-3 py-1 text-sm">Download PDF</Link>
          <a href="#" className="rounded-md border px-3 py-1 text-sm">Copy link</a>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Overview</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {parsed.overviewBullets?.map((item: string) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 font-semibold">Signal mix</h2>
        <table className="w-full text-left text-sm">
          <thead><tr className="text-slate-500"><th>Trigger</th><th>Count</th></tr></thead>
          <tbody>
            {parsed.signalMix?.map((row: any) => (
              <tr key={row.triggerType} className="border-t"><td className="py-2">{row.triggerType}</td><td>{row.count}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Detailed Signal Findings</h2>
        {parsed.signals?.map((signal: any) => (
          <div key={signal.headline} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-medium">{signal.companyName} <span className="text-slate-500">({signal.sponsorName})</span></h3>
            <p className="mt-1 text-sm">{signal.headline}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-2 py-1">{signal.classification}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">Confidence {signal.confidenceScore}/5</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">{signal.primaryTriggerCategory}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Sources</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {parsed.sources?.map((source: any) => (
            <li key={source.refNumber}><a className="text-brand underline" href={source.url}>[{source.refNumber}] {source.title}</a> <span className="text-slate-500">{source.domain}</span></li>
          ))}
        </ul>
      </section>

      <EmailReportForm date={params.date} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Archive</h2>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          {archive?.map((entry) => <Link key={entry.report_date} className="rounded-md border px-2 py-1" href={`/reports/${entry.report_date}`}>{entry.report_date}</Link>)}
        </div>
      </section>
    </article>
  );
}
