"use client";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

export default function UserProfileEditor() {
  const { data: session, update } = useSession();

  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const t = useTranslations("Account.ui.userProfile");
  const tCommon = useTranslations("Common");
  const tErrors = useTranslations("Errors");

  useEffect(() => {
    fetch("/api/account/profile").then(r => r.json()).then(data => {
      setEmail(data.email || "");
      setNewEmail(data.email || "");
      setAvatarUrl(data.avatarUrl || null);
    }).finally(() => setLoading(false));
  }, []);

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/account/profile/avatar", { method: "POST", body: form })
    if (res.ok) {
      const json = await res.json();
      if (json.url) setAvatarUrl(json.url);
      if (update && session) {
        // Update the user session with the new avatar URL
        const newUser = { ...session.user, avatarUrl: json.url };
        update(newUser);
      }
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error === "TYPE" ? tErrors("invalidFileType") : j.error === "SIZE" ? tErrors("fileTooLarge", { maxSize: "2MB" }) : tErrors("avatarUploadFailed"));
    }
  }

  function saveEmail() {
    setError(null); setMessage(null);
    if (!newEmail.includes("@")) { setError(t("invalidEmail")); return; }
    startTransition(async () => {
      const res = await fetch("/api/account/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: newEmail }) });
      if (res.ok) { setEmail(newEmail); setMessage(t("emailUpdated")); } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error === "EMAIL_IN_USE" ? t("emailInUse") : t("invalidEmail"));
      }
    });
  }

  function updatePassword() {
    setError(null); setMessage(null);
    if (newPassword.length < 8) { setError(t("weakPassword")); return; }
    if (newPassword !== confirmPassword) { setError(t("mismatch")); return; }
    startTransition(async () => {
      const res = await fetch("/api/account/profile/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      if (res.ok) { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setMessage(t("passwordUpdated")); } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error === "INVALID_CURRENT" ? "Current password incorrect" : t("weakPassword"));
      }
    });
  }

  if (loading) return <div className="text-sm text-neutral-500">{tCommon("loading")}</div>;

  return (
    <div className="space-y-10">
      <div className="grid md:grid-cols-3 gap-8">
        <section className="md:col-span-1 space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">{t("title")}</h2>
          <p className="text-xs text-neutral-500 leading-relaxed max-w-xs">Manage your basic profile information. Only email, password and profile image are editable.</p>
          {message && <div className="text-[11px] text-success">{message}</div>}
          {error && <div className="text-[11px] text-danger">{error}</div>}
        </section>
        <div className="md:col-span-2 space-y-12">
          <section className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">{t("avatar")}</h3>
            <label htmlFor="avatar-upload" className="flex flex-row items-center justify-start gap-4 cursor-pointer">
              <div className="size-20 rounded-full bg-neutral-200 overflow-hidden border">
                {avatarUrl ? <img src={avatarUrl} alt="avatar" className="object-cover w-full h-full" /> : <span className="text-[10px] text-neutral-500">IMG</span>}
              </div>
              <span className="text-xs text-neutral-500">{t("clickToUpload")}</span>
              <input id="avatar-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={onAvatarChange} className="hidden" />
            </label>
          </section>
          <section className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">{t("changeEmail")}</h3>
            <div className="space-y-2">
              <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("email")}</label>
              <input disabled value={email} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-neutral-50" />
              <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("newEmail")}</label>
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              <button onClick={saveEmail} disabled={isPending} className="btn btn-secondary">{isPending ? t("updating") : t("saveEmail")}</button>
            </div>
          </section>
          <section className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">{t("password")}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] uppercase tracking-wide text-neutral-500">{t("currentPassword")}</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wide text-neutral-500">{t("newPassword")}</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wide text-neutral-500">{t("confirmPassword")}</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <button onClick={updatePassword} disabled={isPending} className="btn btn-primary">{isPending ? t("updating") : t("updatePassword")}</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
