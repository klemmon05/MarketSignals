import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const signalId = searchParams.get('signalId');
  const mode = searchParams.get('mode');
  const supabase = createClient();

  if (mode === 'followup' && signalId) {
    await requireAdmin();
    const { data: state } = await supabase.from('follow_up_state').select('*').eq('signal_id', signalId).maybeSingle();
    const { data: actions } = await supabase.from('follow_up_actions').select('*').eq('signal_id', signalId).order('created_at', { ascending: false });
    return NextResponse.json({ state, actions });
  }

  let query = supabase.from('signals').select('id,company_name,sponsor_name,headline,classification,reports!inner(report_date,is_published,visibility)');
  if (q) query = query.or(`company_name.ilike.%${q}%,sponsor_name.ilike.%${q}%,headline.ilike.%${q}%`);
  const { data } = await query.limit(100);
  const safe = (data ?? []).filter((d: any) => d.reports.is_published && d.reports.visibility === 'public');
  return NextResponse.json({ results: safe });
}

export async function POST(req: Request) {
  await requireAdmin();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const body = await req.json();

  if (body.mode === 'state') {
    const payload: any = {
      signal_id: body.signalId,
      status: body.status,
      resolution_notes: body.notes,
      updated_by: user?.id
    };
    if (body.status === 'resolved') payload.resolved_at = new Date().toISOString();
    await supabase.from('follow_up_state').upsert(payload);
    return NextResponse.json({ ok: true });
  }

  if (body.mode === 'action') {
    await supabase.from('follow_up_actions').insert({
      signal_id: body.signalId,
      action_date: body.action_date || new Date().toISOString().slice(0, 10),
      contact_name: body.contact_name,
      contact_org: body.contact_org,
      channel: body.channel,
      notes: body.notes
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unsupported mode' }, { status: 400 });
}
