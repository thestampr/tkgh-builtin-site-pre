"use client";

import { useToast } from "@/src/hooks/useToast";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";

function validateEmail(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

export default function ProviderAccountSettings() {
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [emailUpdating, updateEmail] = useTransition();
  const [passwordUpdating, updatePassword] = useTransition();

  const t = useTranslations("Account.ui");
  const tCommon = useTranslations("Common");
  const tSettings = useTranslations("Account.ui.settings");
  
  const { showSuccessToast } = useToast();

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/account/profile");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (active) setEmail(data.email || "");
      } catch {
        // swallow; could set an error state if needed
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadProfile();
    return () => { active = false; };
  }, []);
  const handleNewEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEmail(e.target.value);
  }, []);

  const handleCurrentPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPassword(e.target.value);
  }, []);

  const handleNewPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
  }, []);

  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  }, []);

  const handleSaveEmail = useCallback(async () => {
    setEmailError(null);
    if (!validateEmail(newEmail)) return setEmailError(t("userProfile.invalidEmail"));
    updateEmail(async () => {
      try {
        const res = await fetch("/api/account/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: newEmail })
        });
        if (res.ok) {
          setEmail(newEmail);
          showSuccessToast({ title: t("userProfile.emailUpdated") });
        } else {
          const j = await res.json().catch(() => ({}));
          setEmailError(j.error === "EMAIL_IN_USE" ? t("userProfile.emailInUse") : t("userProfile.invalidEmail"));
        }
      } catch {
        setEmailError(t("userProfile.invalidEmail"));
      }
    });
  }, [newEmail, t]);

  const handleUpdatePassword = useCallback(async () => {
    setPasswordError(null);
    if (newPassword.length < 8) { setPasswordError(t("userProfile.weakPassword")); return; }
    if (newPassword !== confirmPassword) { setPasswordError(t("userProfile.mismatch")); return; }
    updatePassword(async () => {
      try {
        const res = await fetch("/api/account/profile/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        if (res.ok) {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          showSuccessToast({ title: t("userProfile.passwordUpdated") });
        } else {
          const j = await res.json().catch(() => ({}));
          setPasswordError(j.error === "INVALID_CURRENT" ? "Current password incorrect" : t("userProfile.weakPassword"));
        }
      } catch {
        setPasswordError(t("userProfile.weakPassword"));
      }
    });
  }, [currentPassword, newPassword, confirmPassword, t]);

  if (loading) return <div className="text-sm text-neutral-500">{tCommon("loading")}</div>;

  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-neutral-200/70 bg-white/70 backdrop-blur p-6 space-y-4">
        <header>
          <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">{tSettings("accountSectionTitle")}</h2>
          <p className="text-xs text-neutral-500">{tSettings("accountSectionSubtitle")}</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{tSettings("currentEmail")}</label>
            <input disabled value={email} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-neutral-50" />
          </div>
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("userProfile.newEmail")}</label>
            <input value={newEmail} onChange={handleNewEmailChange} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <span className="text-xs text-danger h-6">{emailError ?? <>&nbsp;</>}</span>
        </div>
        <div className="md:col-span-2">
          <button onClick={handleSaveEmail} disabled={emailUpdating || !newEmail || email === newEmail || !validateEmail(newEmail)} className="btn btn-secondary btn-sm">
            {emailUpdating ? t("userProfile.updating") : t("userProfile.saveEmail")}
          </button>
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
            <input type="password" value={currentPassword} onChange={handleCurrentPasswordChange} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-neutral-500">{t("userProfile.newPassword")}</label>
            <input type="password" value={newPassword} onChange={handleNewPasswordChange} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-neutral-500">{t("userProfile.confirmPassword")}</label>
            <input type="password" value={confirmPassword} onChange={handleConfirmPasswordChange} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <span className="text-xs text-danger h-6">{passwordError ?? <>&nbsp;</>}</span>
          <div className="md:col-span-2 mt-2">
            <button onClick={handleUpdatePassword} disabled={passwordUpdating || !currentPassword || !newPassword || newPassword !== confirmPassword} className="btn btn-primary btn-sm">
              {passwordUpdating ? t("userProfile.updating") : t("userProfile.updatePassword")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
