import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function FollowUpsDashboard() {
  await requireAdmin();
  const supabase = createClient();
  const { data: rows } = await supabase
    .from('signals')
    .select('id,company_name,sponsor_name,headline,follow_up_state(status)')
    .limit(200);

  const counts = { open: 0, in_progress: 0, resolved: 0 };
  rows?.forEach((r: any) => {
    const s = r.follow_up_state?.[0]?.status ?? 'open';
    if (s in counts) (counts as any)[s] += 1;
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Follow-up dashboard</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">Open: {counts.open}</div>
        <div className="rounded-xl border bg-white p-4">In progress: {counts.in_progress}</div>
        <div className="rounded-xl border bg-white p-4">Resolved: {counts.resolved}</div>
      </div>
      <div className="rounded-xl border bg-white p-4">
        {rows?.map((r: any) => <p key={r.id} className="border-b py-2 text-sm">{r.company_name} ({r.sponsor_name}) — {r.follow_up_state?.[0]?.status ?? 'open'}</p>)}
      </div>
    </div>
  );
}
