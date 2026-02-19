import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseDailyReport } from '@/lib/parser/report-parser';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  await requireAdmin();
  const { rawText, action, publish } = await req.json();
  const preview = parseDailyReport(rawText);

  if (action === 'preview') return NextResponse.json({ preview });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: report, error } = await supabase
    .from('reports')
    .upsert({
      report_date: preview.reportDate,
      title: preview.title,
      raw_text: rawText,
      parsed_json: preview,
      is_published: Boolean(publish),
      visibility: publish ? 'public' : 'private',
      created_by: user?.id
    }, { onConflict: 'report_date' })
    .select('id')
    .single();

  if (error || !report) return NextResponse.json({ error: error?.message ?? 'Failed to save report' }, { status: 400 });

  await supabase.from('signals').delete().eq('report_id', report.id);
  await supabase.from('sources').delete().eq('report_id', report.id);
  await supabase.from('outreach_recommendations').delete().eq('report_id', report.id);

  if (preview.signals.length) {
    await supabase.from('signals').insert(preview.signals.map((s) => ({
      report_id: report.id,
      company_name: s.companyName,
      sponsor_name: s.sponsorName,
      headline: s.headline,
      signal_detected: s.signalDetected,
      classification: s.classification,
      primary_trigger_category: s.primaryTriggerCategory,
      secondary_triggers: s.secondaryTriggers,
      confidence_score: s.confidenceScore,
      merits_outreach: s.meritsOutreach,
      outreach_reasoning: s.outreachReasoning,
      potential_for_transformation: s.potentialForTransformation,
      evidence_bullets: s.evidenceBullets,
      source_refs: s.sourceRefs
    })));
  }

  if (preview.sources.length) await supabase.from('sources').insert(preview.sources.map((s) => ({ report_id: report.id, ref_number: s.refNumber, title: s.title, url: s.url, domain: s.domain })));
  if (preview.recommendedOutreach.length) await supabase.from('outreach_recommendations').insert(preview.recommendedOutreach.map((r) => ({ report_id: report.id, company_name: r.companyName, sponsor_name: r.sponsorName, trigger_type: r.triggerType, confidence_score: r.confidenceScore })));

  return NextResponse.json({ message: 'Report saved successfully.', reportId: report.id, preview });
}
