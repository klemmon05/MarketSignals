import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request, { params }: { params: { date: string } }) {
  const { email } = await req.json();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(ip)) return NextResponse.json({ error: 'Rate limit exceeded (3/hour).' }, { status: 429 });

  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return NextResponse.json({ error: 'Email is not configured.' }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const link = `${process.env.BASE_URL}/reports/${params.date}`;
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `ProSignal report ${params.date}`,
    html: `<p>Your requested ProSignal report is ready.</p><p><a href="${link}">Open report</a> | <a href="${link}/pdf">Download PDF</a></p>`
  });

  return NextResponse.json({ message: 'Email sent.' });
}
