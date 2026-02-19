import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { FollowUpPanel } from '@/components/follow-up-panel';

export default async function AdminReportDetail({ params }: { params: { date: string } }) {
  await requireAdmin();
  const supabase = createClient();

  const { data: report } = await supabase.from('reports').select('id,title,report_date').eq('report_date', params.date).maybeSingle();
  if (!report) notFound();

  const { data: signals } = await supabase
    .from('signals')
    .select('id,company_name,sponsor_name,headline,confidence_score,classification')
    .eq('report_id', report.id)
    .order('company_name');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{report.title}</h1>
      {signals?.map((signal) => (
        <div key={signal.id} className="rounded-xl border bg-white p-4">
          <h2 className="font-medium">{signal.company_name} — {signal.headline}</h2>
          <p className="text-sm text-slate-500">{signal.sponsor_name} • {signal.classification} • {signal.confidence_score}/5</p>
          <FollowUpPanel signalId={signal.id} />
        </div>
      ))}
    </div>
  );
}
