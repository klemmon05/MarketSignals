import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminIngestForm } from '@/components/admin-ingest-form';

export default async function AdminPage() {
  await requireAdmin();
  const supabase = createClient();
  const { data: reports } = await supabase
    .from('reports')
    .select('report_date,title,is_published')
    .order('report_date', { ascending: false })
    .limit(30);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Console</h1>
        <Link href="/admin/follow-ups" className="rounded-md border px-3 py-2 text-sm">Follow-ups</Link>
      </div>
      <AdminIngestForm />
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="font-semibold">Recent reports</h2>
        <div className="mt-3 space-y-2 text-sm">
          {reports?.map((r) => <Link key={r.report_date} href={`/admin/reports/${r.report_date}`} className="block rounded border px-3 py-2">{r.report_date} — {r.title} {r.is_published ? '• Published' : '• Draft'}</Link>)}
        </div>
      </section>
    </div>
  );
}
