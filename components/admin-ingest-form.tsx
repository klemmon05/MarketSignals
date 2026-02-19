'use client';

import { useState } from 'react';

export function AdminIngestForm() {
  const [rawText, setRawText] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [publish, setPublish] = useState(true);
  const [message, setMessage] = useState('');

  async function runPreview() {
    const res = await fetch('/api/admin/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText, action: 'preview' })
    });
    const data = await res.json();
    setPreview(data.preview);
  }

  async function publishReport() {
    const res = await fetch('/api/admin/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText, action: 'publish', publish })
    });
    const data = await res.json();
    setMessage(data.message || data.error);
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-6">
      <h2 className="font-semibold">Paste daily report</h2>
      <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} rows={16} className="w-full rounded-md border p-3 font-mono text-xs" placeholder="Paste Daily Transformation Trigger Summary..." />
      <div className="flex items-center gap-3">
        <button onClick={runPreview} className="rounded-md border px-3 py-2 text-sm">Preview parse</button>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />Publish publicly</label>
        <button onClick={publishReport} className="rounded-md bg-ink px-3 py-2 text-sm text-white">Save</button>
      </div>
      {message && <p className="text-sm text-slate-600">{message}</p>}
      {preview && (
        <div className="rounded-xl bg-slate-50 p-4 text-sm">
          <p><strong>Date:</strong> {preview.reportDate}</p>
          <p><strong>Signals:</strong> {preview.signals?.length ?? 0}</p>
          {preview.warnings?.length > 0 && <p className="text-amber-700">Warnings: {preview.warnings.join(', ')}</p>}
        </div>
      )}
    </section>
  );
}
