import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: { date: string } }) {
  const html = `<html><body><h1>ProSignal Analytics Report ${params.date}</h1><p>Use a headless renderer in production (Playwright) for polished PDFs on Vercel.</p></body></html>`;
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="prosignal-${params.date}.html"`
    }
  });
}
