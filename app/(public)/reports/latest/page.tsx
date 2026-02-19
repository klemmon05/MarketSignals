import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function LatestReportRedirect() {
  const supabase = createClient();
  const { data } = await supabase
    .from('reports')
    .select('report_date')
    .eq('is_published', true)
    .eq('visibility', 'public')
    .order('report_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) redirect('/');
  redirect(`/reports/${data.report_date}`);
}
