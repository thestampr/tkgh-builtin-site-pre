"use client";

import type { Role } from "@prisma/client";
import clsx from "clsx";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Mode = "login" | "register";

interface UnifiedAuthFormProps {
	mode?: Mode;
	role?: Role;
}

export function UnifiedAuthForm({ mode: initialMode = "login", role = "CUSTOMER" }: UnifiedAuthFormProps) {
	const [mode, setMode] = useState<Mode>(initialMode);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const t = useTranslations("Common");
	const tAuth = useTranslations("Auth");

	const handleErrors = (res: Response) => {
		switch (res.status) {
			case 400:
				return tAuth("errors.invalidCredentials") || "Invalid credentials";
			case 409:
				return tAuth("errors.emailInUse") || "Email already in use";
			case 500:
			default:
				return tAuth("errors.unknown") || "Server error";
		}
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null); 
		setSuccess(null); 
		setLoading(true);
		try {
			if (mode === "register") {
				const res = await fetch("/api/auth/register", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, password, role })
				});
				if (!res.ok) {
					setError(handleErrors(res));
					return;
				}
				setSuccess("Registered. You can login now.");
				setMode("login");
			} else {
				const r = await signIn("credentials", { 
					redirect: false, 
					email, password 
				});
				if (r?.error) throw new Error(r.error);
				if (!r?.ok) throw new Error("Login failed");
				setSuccess("Logged in");
				window.location.href = "/";
			}
		} catch (e: unknown) {
			if (e instanceof Error){
				setError(e.message || "Failed");
			}
		} finally {
			setLoading(false);
		}
	}

	return (
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
			{error && <div className="text-sm text-danger">{error}</div>}
			{success && <div className="text-sm text-success">{success}</div>}
			<button
				type="submit"
				disabled={loading}
				className={clsx(
					"w-full py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/90",
					loading ? "opacity-60" : "cursor-pointer"
				)}>
				{mode === "login" ? t("signIn") : t("signUp")}
			</button>
		</form>
	);
}
