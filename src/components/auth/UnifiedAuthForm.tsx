"use client";
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import clsx from 'clsx';

type Mode = 'login' | 'register';
type RoleOption = 'USER' | 'PROVIDER';

interface UnifiedAuthFormProps {
	mode?: Mode;
	fixedRole?: RoleOption; // If provided, hide role selector and force this role
	showRoleSelector?: boolean; // Force showing (defaults to true only when register & no fixedRole)
	hideModeToggle?: boolean; // Hide internal login/register mode switch UI
}

export function UnifiedAuthForm({ mode: initialMode = 'login', fixedRole, showRoleSelector, hideModeToggle }: UnifiedAuthFormProps) {
	const [mode, setMode] = useState<Mode>(initialMode);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState<RoleOption>(fixedRole || 'USER');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null); setSuccess(null); setLoading(true);
		try {
			if (mode === 'register') {
				const res = await fetch('/api/auth/register', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email, password, role })
				});
				if (!res.ok) throw new Error('Register failed');
				setSuccess('Registered. You can login now.');
				setMode('login');
			} else {
				const r = await signIn('credentials', { redirect: false, email, password });
				if (r?.error) throw new Error(r.error);
				if (!r?.ok) throw new Error('Login failed');
				setSuccess('Logged in');
				window.location.href = '/';
			}
		} catch (err: any) {
			setError(err.message || 'Failed');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="space-y-4">
			<form onSubmit={onSubmit} className="space-y-3">
				<div className="space-y-1">
					<label className="block text-sm font-medium">Email</label>
					<input type="email" required value={email} onChange={e => setEmail(e.target.value)}
						className="w-full rounded-md border px-3 py-2 text-sm bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary" />
				</div>
				<div className="space-y-1">
					<label className="block text-sm font-medium">Password</label>
						<input type="password" required value={password} onChange={e => setPassword(e.target.value)}
						className="w-full rounded-md border px-3 py-2 text-sm bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary" />
				</div>
				{mode === 'register' && !fixedRole && (showRoleSelector ?? true) && (
					<div className="space-y-1">
						<label className="block text-sm font-medium">Role</label>
						<select value={role} onChange={e => setRole(e.target.value as RoleOption)}
							className="w-full rounded-md border px-3 py-2 text-sm bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary">
							<option value="USER">User</option>
							<option value="PROVIDER">Provider</option>
						</select>
					</div>
				)}
				{error && <div className="text-sm text-red-600">{error}</div>}
				{success && <div className="text-sm text-green-600">{success}</div>}
				<button disabled={loading} type="submit" className={clsx("w-full py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/90", loading && 'opacity-60 cursor-not-allowed')}>{mode === 'login' ? 'Login' : 'Register'}</button>
			</form>
			{!hideModeToggle && (
				<div className="text-xs text-center">
					{mode === 'login' ? (
						<button onClick={() => { setMode('register'); setError(null); setSuccess(null); }} className="underline">Need an account? Register</button>
					) : (
						<button onClick={() => { setMode('login'); setError(null); setSuccess(null); }} className="underline">Have an account? Login</button>
					)}
				</div>
			)}
		</div>
	);
}
