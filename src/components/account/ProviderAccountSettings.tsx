"use client";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

export default function ProviderAccountSettings() {
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const t = useTranslations("Account.ui");
  const tCommon = useTranslations("Common");
  const tSettings = useTranslations("Account.ui.settings");

  useEffect(() => {
    fetch("/api/account/profile").then(r => r.json()).then(data => {
      setEmail(data.email || "");
      setNewEmail(data.email || "");
    }).finally(() => setLoading(false));
  }, []);

  function saveEmail() {
    setError(null); setMessage(null);
    if (!newEmail.includes("@")) { setError(t("userProfile.invalidEmail")); return; }
    startTransition(async () => {
      const res = await fetch("/api/account/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: newEmail }) });
      if (res.ok) { setEmail(newEmail); setMessage(t("userProfile.emailUpdated")); } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error === "EMAIL_IN_USE" ? t("userProfile.emailInUse") : t("userProfile.invalidEmail"));
      }
    });
  }

  function updatePassword() {
    setError(null); setMessage(null);
    if (newPassword.length < 8) { setError(t("userProfile.weakPassword")); return; }
    if (newPassword !== confirmPassword) { setError(t("userProfile.mismatch")); return; }
    startTransition(async () => {
      const res = await fetch("/api/account/profile/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      if (res.ok) { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setMessage(t("userProfile.passwordUpdated")); } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error === "INVALID_CURRENT" ? "Current password incorrect" : t("userProfile.weakPassword"));
      }
    });
  }

  if (loading) return <div className="text-sm text-neutral-500">{tCommon("loading")}</div>;

  return (
    <div className="space-y-10">
      {message && <div className="text-[11px] text-accent">{message}</div>}
      {error && <div className="text-[11px] text-danger">{error}</div>}

      <section className="rounded-xl border border-neutral-200/70 bg-white/70 backdrop-blur p-6 space-y-4">
        <header>
          <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">{tSettings("accountSectionTitle")}</h2>
          <p className="text-xs text-neutral-500">{tSettings("accountSectionSubtitle")}</p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{tSettings("currentEmail")}</label>
            <input disabled value={email} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-neutral-50" />
          </div>
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("userProfile.newEmail")}</label>
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            <div>
              <button onClick={saveEmail} disabled={isPending} className="btn btn-secondary">{isPending ? t("userProfile.updating") : t("userProfile.saveEmail")}</button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200/70 bg-white/70 backdrop-blur p-6 space-y-4">
        <header>
          <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">{tSettings("passwordSectionTitle")}</h2>
          <p className="text-xs text-neutral-500">{tSettings("passwordSectionSubtitle")}</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-neutral-500">{t("userProfile.currentPassword")}</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-neutral-500">{t("userProfile.newPassword")}</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-neutral-500">{t("userProfile.confirmPassword")}</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <button onClick={updatePassword} disabled={isPending} className="btn btn-primary">
              {isPending ? t("userProfile.updating") : t("userProfile.updatePassword")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
