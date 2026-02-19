import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = createClient();
  const { data: latest } = await supabase
    .from('reports')
    .select('report_date,title,parsed_json')
    .eq('is_published', true)
    .eq('visibility', 'public')
    .order('report_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const overview = (latest?.parsed_json as any)?.overviewBullets ?? [];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Daily Transformation Trigger Intelligence</h1>
        <p className="mt-2 text-slate-600">Browse today’s published signal report or explore archive dates.</p>
        {latest ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-slate-500">Latest: {latest.report_date}</p>
            <Link href={`/reports/${latest.report_date}`} className="inline-flex rounded-lg bg-ink px-4 py-2 text-white">Open report</Link>
          </div>
        ) : (
          <p className="mt-6 text-slate-500">No public reports yet.</p>
        )}
      </div>
      {overview.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">Highlights</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {overview.map((item: string) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
