'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  async function login() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin` }
    });
    setMessage(error ? error.message : 'Magic link sent.');
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border bg-white p-6">
      <h1 className="text-xl font-semibold">Admin login</h1>
      <input className="mt-4 w-full rounded-md border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@firm.com"/>
      <button onClick={login} className="mt-3 rounded-md bg-ink px-4 py-2 text-white">Send magic link</button>
      {message && <p className="mt-2 text-sm text-slate-500">{message}</p>}
    </div>
  );
}
