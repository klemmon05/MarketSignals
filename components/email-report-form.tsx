'use client';

import { useState } from 'react';

export function EmailReportForm({ date }: { date: string }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  async function submit() {
    const res = await fetch(`/api/reports/${date}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    setMessage(data.message || data.error);
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4">
      <label className="text-sm font-medium">Email report to myself</label>
      <div className="flex gap-2">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@firm.com" className="w-full rounded-md border px-3 py-2 text-sm" />
        <button onClick={submit} className="rounded-md bg-ink px-3 py-2 text-sm text-white">Send</button>
      </div>
      {message && <p className="text-xs text-slate-500">{message}</p>}
    </div>
  );
}
