'use client';

import { useEffect, useState } from 'react';

type Action = { id: string; action_date: string; channel: string; notes: string; contact_name?: string; contact_org?: string };

export function FollowUpPanel({ signalId }: { signalId: string }) {
  const [status, setStatus] = useState('open');
  const [notes, setNotes] = useState('');
  const [actions, setActions] = useState<Action[]>([]);
  const [newAction, setNewAction] = useState({ action_date: '', contact_name: '', contact_org: '', channel: 'other', notes: '' });

  async function load() {
    const res = await fetch(`/api/search?signalId=${signalId}&mode=followup`);
    const data = await res.json();
    setStatus(data.state?.status ?? 'open');
    setNotes(data.state?.resolution_notes ?? '');
    setActions(data.actions ?? []);
  }
  useEffect(() => { load(); }, [signalId]);

  async function saveState() {
    await fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'state', signalId, status, notes }) });
    load();
  }

  async function addAction() {
    await fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'action', signalId, ...newAction }) });
    setNewAction({ action_date: '', contact_name: '', contact_org: '', channel: 'other', notes: '' });
    load();
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg bg-slate-50 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border px-2 py-1">
          <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="not_actionable">Not actionable</option>
        </select>
        <button onClick={saveState} className="rounded border px-2 py-1">Save status</button>
      </div>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Resolution notes" className="w-full rounded border p-2" />
      <div className="grid gap-2 md:grid-cols-4">
        <input type="date" value={newAction.action_date} onChange={(e) => setNewAction({ ...newAction, action_date: e.target.value })} className="rounded border px-2 py-1" />
        <input placeholder="Contact name" value={newAction.contact_name} onChange={(e) => setNewAction({ ...newAction, contact_name: e.target.value })} className="rounded border px-2 py-1" />
        <input placeholder="Contact org" value={newAction.contact_org} onChange={(e) => setNewAction({ ...newAction, contact_org: e.target.value })} className="rounded border px-2 py-1" />
        <select value={newAction.channel} onChange={(e) => setNewAction({ ...newAction, channel: e.target.value })} className="rounded border px-2 py-1"><option>email</option><option>call</option><option>text</option><option>linkedin</option><option>internal</option><option>other</option></select>
      </div>
      <textarea value={newAction.notes} onChange={(e) => setNewAction({ ...newAction, notes: e.target.value })} placeholder="Action notes" className="w-full rounded border p-2" />
      <button onClick={addAction} className="rounded bg-ink px-3 py-1 text-white">Add follow-up action</button>
      <ul className="space-y-1">
        {actions.map((a) => <li key={a.id} className="rounded border bg-white p-2">{a.action_date} • {a.channel} • {a.notes}</li>)}
      </ul>
    </div>
  );
}
