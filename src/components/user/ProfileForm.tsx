"use client";
import { useEffect, useState, useTransition } from 'react';

interface ProfileData {
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

export default function ProfileForm({ locale }: { locale: string }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState<ProfileData>({});
  const [saving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/user/profile').then(r => r.json()).then(d => {
      if (d.profile) {
        setProfile(d.profile);
        setForm({ displayName: d.profile.displayName || '', bio: d.profile.bio || '', avatarUrl: d.profile.avatarUrl || '' });
      }
    });
  }, []);

  function update<K extends keyof ProfileData>(key: K, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setMessage(null);
      const res = await fetch('/api/user/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) {
        setMessage('Saved');
      } else {
        const j = await res.json().catch(() => ({}));
        setMessage(j.error || 'Failed');
      }
    });
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#8a6a40] via-[#a4814f] to-[#8a6a40]">Account Profile</h1>
        <p className="text-sm text-neutral-500 mt-1">Update your basic information.</p>
      </div>
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">Display Name</label>
          <input value={form.displayName || ''} onChange={e => update('displayName', e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c4a572]" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">Avatar URL</label>
          <input value={form.avatarUrl || ''} onChange={e => update('avatarUrl', e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c4a572]" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">Bio</label>
          <textarea value={form.bio || ''} onChange={e => update('bio', e.target.value)} rows={4} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c4a572]" />
        </div>
        <button disabled={saving} className="inline-flex items-center rounded-lg bg-[#c4a572] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#b29155] disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
        {message && <div className="text-xs text-neutral-600">{message}</div>}
      </form>
    </div>
  );
}
