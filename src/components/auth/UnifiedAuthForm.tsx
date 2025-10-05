"use client";

import type { Role } from "@prisma/client";
import clsx from "clsx";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

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
	const [redirect, setRedirect] = useState<string | null>(null);

	const t = useTranslations("Common");
	const tAuth = useTranslations("Auth");

	useEffect(() => {
		if (typeof window === "undefined") return;
		const params = new URLSearchParams(window.location.search);
		const r = params.get("redirect");
		if (r) setRedirect(r);
	}, []);

	const handleErrors = (status?: number) => {
		switch (status) {
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
					setError(handleErrors(res.status));
					return;
				}
				setSuccess("Registered. You can login now.");
				setMode("login");
			} else {
				const r = await signIn("credentials", {
					redirect: false,
					email, password
				});
				if (r?.error) {
					setError(handleErrors(400));
					return;
				}
				if (r?.ok) {
					setError(handleErrors(r.status));
					return;
				}
				setSuccess("Logged in");
				window.location.href = redirect || "/";
			}
		} catch (e: unknown) {
			if (e instanceof Error) {
				setError(e.message || "Failed");
			}
		} finally {
			setLoading(false);
		}
	}

	const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEmail(e.target.value);
		setError(null);
	}

	const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPassword(e.target.value);
		setError(null);
	}

	return (
		<form onSubmit={onSubmit} className="space-y-3">
			<div className="space-y-1">
				<label className="block text-sm font-medium">Email</label>
				<input type="email" required value={email} onChange={onEmailChange}
					className={clsx(
						"w-full input",
						!!success ? "input-success" : error ? "input-error" : "",
					)} />
			</div>
			<div className="space-y-1">
				<label className="block text-sm font-medium">Password</label>
				<input type="password" required value={password} onChange={onPasswordChange}
					className={clsx(
						"w-full input",
						!!success ? "input-success" : error ? "input-error" : "",
					)} />
			</div>
			<div className="text-xs">
				{ success 
					? <div className="text-success">{success}</div>
					: error
					  ? <div className="text-danger">{error}</div>
						: <div className="pointer-events-none opacity-0">placeholder</div>
				}
			</div>
			<br />
			<button
				type="submit"
				disabled={loading}
				className={clsx(
					"btn w-full btn-sm",
					loading ? "btn-secondary" : "btn-primary"
				)}>
				{mode === "login" ? t("signIn") : t("signUp")}
			</button>
		</form>
	);
}
