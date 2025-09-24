"use client";

import { Profile, ProfileTranslation } from "@prisma/client";
import clsx from "clsx";
import * as Lucide from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { IconPicker } from "../IconPicker";
import { ProviderCTA } from "../ProviderCTA";

interface ProfileEditorProps {
  initialProfile: Profile | null;
  inline?: boolean; // compact mode for user account page
}

type CTAConfig = {
  label: string;
  color: string;
  size: string;
  icon: string;
  href: string;
  style: string;
  radius: string;
};

type Channel = { type: string; value: string };
interface ContactData { channels: Channel[] }

function parseJSON<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

const defaultCta: CTAConfig = {
  label: "Example",
  color: "#8a6a40",
  size: "md",
  icon: "MessageCircle",
  href: "#",
  style: "solid",
  radius: "full"
};

export default function ProfileEditor({ initialProfile, inline = false }: ProfileEditorProps) {
  const { data: session, update } = useSession();
  const t = useTranslations("Account.ui");
  const tErrors = useTranslations("Errors");
  const tProfile = useTranslations("Profile");
  const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "th";
  const [activeLocale, setActiveLocale] = useState<string>(defaultLocale);
  const [displayName, setDisplayName] = useState(initialProfile?.displayName || "");
  const [bio, setBio] = useState(initialProfile?.bio || "");
  const [trDisplayName, setTrDisplayName] = useState<string>("");
  const [trBio, setTrBio] = useState<string>("");
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [contacts, setContacts] = useState<ContactData>(() => parseJSON<ContactData>(initialProfile?.contactJson as string, { channels: [] }));
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => initialProfile?.avatarUrl || null);
  const [ctaConfig, setCtaConfig] = useState<CTAConfig>(() => {
    const parsed = parseJSON<CTAConfig>(initialProfile?.ctaJson as string, defaultCta);
    if (!parsed.radius) parsed.radius = "full";
    return parsed;
  });
  const [coverImage, setCoverImage] = useState<string | null>(initialProfile ? (initialProfile as any).coverImage || null : null);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [ctaLabelTr, setCtaLabelTr] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function addChannel() {
    setContacts(c => ({ channels: [...c.channels, { type: "link", value: "" }] }));
  }
  function updateChannel(i: number, field: keyof Channel, value: string) {
    setContacts(c => ({ channels: c.channels.map((ch, idx) => idx === i ? { ...ch, [field]: value } : ch) }));
  }
  function removeChannel(i: number) {
    setContacts(c => ({ channels: c.channels.filter((_, idx) => idx !== i) }));
  }

  function validate(): boolean {
    const errs: string[] = [];
    contacts.channels.forEach((ch, i) => { if (!ch.value.trim()) errs.push(`Channel #${i + 1} empty`); });
    setErrors(errs);
    return !errs.length;
  }

  async function saveBase() {
    if (!validate()) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/provider/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        bio,
        contactJson: JSON.stringify(contacts),
        avatarUrl,
        coverImage,
        ctaJson: JSON.stringify(ctaConfig)
      })
    });
    setSaving(false);
    setMessage(res.ok ? "Saved" : "Save failed");
    if (res.ok && update) {
      const newUser = await res.json();
      update(newUser);
    }
  }

  function cancel() {
    setDisplayName(initialProfile?.displayName || "");
    setBio(initialProfile?.bio || "");
    setContacts(parseJSON<ContactData>(initialProfile?.contactJson as string, { channels: [] }));
    setAvatarUrl(initialProfile?.avatarUrl || null);
    setCoverImage((initialProfile as any)?.coverImage || null);
    setCtaConfig(parseJSON<CTAConfig>(initialProfile?.ctaJson as string, defaultCta));
    setTrDisplayName("");
    setTrBio("");
    setCtaLabelTr("");
    setMessage("Canceled");
  }

  // Load translation when switching to non-default locale
  useEffect(() => {
    if (activeLocale === defaultLocale) return;
    setLoadingTranslation(true);
    fetch(`/api/provider/profile?withTranslations=1`).then(r => r.json()).then(json => {
      const tr = json.profile?.translations?.find((x: ProfileTranslation) => x.locale === activeLocale);
      if (tr) {
        setTrDisplayName(tr.displayName || "");
        setTrBio(tr.bio || "");
        setCtaLabelTr(tr.ctaLabel || "");
      } else {
        setTrDisplayName("");
        setTrBio("");
        setCtaLabelTr("");
      }
    }).finally(() => setLoadingTranslation(false));
  }, [activeLocale]);

  function saveTranslation() {
    if (activeLocale === defaultLocale) return;
    setSaving(true);
    fetch("/api/provider/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        translationLocale: activeLocale,
        translation: {
          displayName: trDisplayName || null,
          bio: trBio || null,
          ctaLabel: ctaLabelTr === "" ? "" : ctaLabelTr
        }
      })
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(() => setMessage("Saved"))
      .catch(() => setMessage("Save failed"))
      .finally(() => setSaving(false));
  }

  async function onAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setErrors(er => [...er, "TYPE"]);
      return;
    }
    if (file.size > 512 * 1024) {
      setErrors(er => [...er, "SIZE"]);
      return;
    }
    setSaving(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/provider/profile/avatar", { method: "POST", body: form });
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
      const err = j.error === "TYPE" ? tErrors("invalidFileType") : j.error === "SIZE" ? tErrors("fileTooLarge", { maxSize: "2MB" }) : tErrors("avatarUploadFailed");
      setErrors(er => [...er, err]);
    }
    setSaving(false);
  }

  async function onCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setErrors(er => [...er, "TYPE"]);
      return;
    }
    if (file.size > 1024 * 1024) {
      setErrors(er => [...er, "SIZE"]);
      return;
    }
    setSaving(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/provider/profile/cover", { method: "POST", body: form });
    if (res.ok) {
      const json = await res.json();
      if (json.url) setCoverImage(json.url);
    }
    setSaving(false);
  }

  return (
    <div className={inline ? "space-y-8" : "max-w-5xl mx-auto px-6 pb-10 space-y-10"}>
      <div>
        {!inline && <>
          <h1 className="text-2xl font-semibold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#8a6a40] via-[#a4814f] to-[#8a6a40]">{tProfile("title")}</h1>
          <p className="text-sm text-neutral-500 mt-1">{tProfile("subtitle")}</p>
        </>}
      </div>
      <div className={clsx(
        "grid ",
        inline ? "md:grid-cols-2 gap-10" : "max-w-2xl gap-10"
      )}>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <button onClick={activeLocale === defaultLocale ? saveBase : saveTranslation} disabled={saving} className="btn btn-primary">Save</button>
          <button type="button" onClick={cancel} className="btn btn-ghost">Cancel</button>
          <div className="flex items-center gap-2 ml-auto">
            {[defaultLocale, "en"].map(loc => (
              <button key={loc} onClick={() => setActiveLocale(loc)} className={clsx(
                "btn btn-sm",
                activeLocale === loc ? "btn-secondary" : "btn-ghost"
              )}>{loc.toUpperCase()}</button>
            ))}
          </div>
          {message && <span className="text-xs text-neutral-500">{message}</span>}
        </div>
        {!!errors.length && (
          <ul className="text-xs text-danger space-y-1">
            {errors.map(e => <li key={e}>{e === "TYPE" ? "Invalid file type" : e === "SIZE" ? "File too large (512KB max)" : e}</li>)}
          </ul>
        )}
        <form onSubmit={e => { e.preventDefault(); activeLocale === defaultLocale ? saveBase() : saveTranslation(); }} className="space-y-6">
          {activeLocale !== defaultLocale && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">Editing translation for locale <strong>{activeLocale}</strong></div>
          )}
          <div className="space-y-6">
            <section className="rounded-xl border border-neutral-200 bg-white/60 backdrop-blur p-5 space-y-4">
              <h3 className="text-xs font-semibold tracking-wide uppercase text-neutral-500">Avatar</h3>
              <fieldset className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="size-16 rounded-full bg-neutral-200 overflow-hidden flex items-center justify-center border border-neutral-300">
                    {avatarUrl ? <img src={avatarUrl} alt="avatar" className="object-cover w-full h-full" /> : <span className="text-[10px] text-neutral-500">IMG</span>}
                  </div>
                  <div className="space-y-2 text-xs">
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onAvatarSelect} />
                    {avatarUrl && <button type="button" onClick={() => setAvatarUrl(null)} className="underline text-neutral-600">Remove</button>}
                  </div>
                </div>
              </fieldset>
            </section>
            <section className="rounded-xl border border-neutral-200 bg-white/60 backdrop-blur p-5 space-y-4">
              <h3 className="text-xs font-semibold tracking-wide uppercase text-neutral-500">Cover Image</h3>
              <fieldset className="space-y-3">
                <div className="space-y-2">
                  <div className="aspect-[16/6] w-full rounded-lg overflow-hidden bg-neutral-100 border border-neutral-300">
                    {coverImage ? (
                      <img src={coverImage} alt="cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[11px] text-neutral-400">No cover</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onCoverSelect} />
                    {coverImage && <button type="button" onClick={() => setCoverImage(null)} className="underline text-neutral-600">Remove</button>}
                  </div>
                  <p className="text-[11px] text-neutral-500">Recommended 1600x600px, JPG/PNG/WebP, up to 1MB.</p>
                </div>
              </fieldset>
            </section>
            <section className="rounded-xl border border-neutral-200 bg-white/60 backdrop-blur p-5 space-y-4">
              <h3 className="text-xs font-semibold tracking-wide uppercase text-neutral-500">Basic Info</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Display Name{activeLocale !== defaultLocale && " (EN)"}</label>
                  <input value={activeLocale === defaultLocale ? displayName : trDisplayName} onChange={e => activeLocale === defaultLocale ? setDisplayName(e.target.value) : setTrDisplayName(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Bio{activeLocale !== defaultLocale && " (EN)"}</label>
                  <textarea value={activeLocale === defaultLocale ? bio : trBio} onChange={e => activeLocale === defaultLocale ? setBio(e.target.value) : setTrBio(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm h-32 resize-y focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white" />
                </div>
              </div>
            </section>
            {activeLocale === defaultLocale && (
              <section className="rounded-xl border border-neutral-200 bg-white/60 backdrop-blur p-5 space-y-4">
                <h3 className="text-xs font-semibold tracking-wide uppercase text-neutral-500">CTA Button</h3>
                <fieldset className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[11px] uppercase tracking-wide text-neutral-500">Label</label>
                      <input value={ctaConfig.label || ""} onChange={e => setCtaConfig((c) => ({ ...c, label: e.target.value }))} className="w-full rounded border border-neutral-300 px-2 py-1 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] uppercase tracking-wide text-neutral-500">Href</label>
                      <input value={ctaConfig.href || ""} onChange={e => setCtaConfig((c) => ({ ...c, href: e.target.value }))} className="w-full rounded border border-neutral-300 px-2 py-1 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] uppercase tracking-wide text-neutral-500">Color</label>
                      <input type="color" value={ctaConfig.color || "#8a6a40"} onChange={e => setCtaConfig((c) => ({ ...c, color: e.target.value }))} className="h-9 w-14 border rounded cursor-pointer" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] uppercase tracking-wide text-neutral-500">Size</label>
                      <select value={ctaConfig.size || "md"} onChange={e => setCtaConfig((c) => ({ ...c, size: e.target.value }))} className="w-full rounded border border-neutral-300 px-2 py-1 text-sm">
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] uppercase tracking-wide text-neutral-500">Icon</label>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setIconPickerOpen(true)} className="px-3 py-2 rounded border border-neutral-300 text-xs bg-white hover:bg-neutral-50 inline-flex items-center gap-2">
                          {ctaConfig.icon && (() => { const I = (Lucide as any)[ctaConfig.icon]; return I ? <I size={16} /> : null; })()}
                          <span>{ctaConfig.icon || "Pick"}</span>
                        </button>
                        {ctaConfig.icon && <button type="button" onClick={() => setCtaConfig((c) => ({ ...c, icon: "" }))} className="text-[10px] px-2 py-1 rounded border border-neutral-300 hover:bg-neutral-100">✕</button>}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] uppercase tracking-wide text-neutral-500">Style</label>
                      <select value={ctaConfig.style || "solid"} onChange={e => setCtaConfig((c) => ({ ...c, style: e.target.value }))} className="w-full rounded border border-neutral-300 px-2 py-1 text-sm">
                        <option value="solid">Solid</option>
                        <option value="outline">Outline</option>
                        <option value="ghost">Ghost</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] uppercase tracking-wide text-neutral-500">Radius</label>
                      <select value={ctaConfig.radius || "full"} onChange={e => setCtaConfig((c) => ({ ...c, radius: e.target.value }))} className="w-full rounded border border-neutral-300 px-2 py-1 text-sm">
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                        <option value="full">Full</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="text-[11px] text-neutral-500">Preview:</div>
                    <div className="py-12 flex items-center justify-center bg-neutral-100 rounded">
                      <ProviderCTA config={ctaConfig} preview />
                    </div>
                  </div>
                </fieldset>
              </section>
            )}
            {activeLocale !== defaultLocale && (
              <section className="rounded-xl border border-neutral-200 bg-white/60 backdrop-blur p-5 space-y-4">
                <h3 className="text-xs font-semibold tracking-wide uppercase text-neutral-500">CTA (EN)</h3>
                <fieldset className="space-y-3">
                  <legend className="sr-only">CTA Label EN</legend>
                  <input value={ctaLabelTr} onChange={e => setCtaLabelTr(e.target.value)} className="w-full rounded border border-neutral-300 px-2 py-1 text-sm" />
                </fieldset>
              </section>
            )}
            <section className="rounded-xl border border-neutral-200 bg-white/60 backdrop-blur p-5 space-y-4">
              <h3 className="text-xs font-semibold tracking-wide uppercase text-neutral-500 flex items-center justify-between">{t("contactChannels")}
                <button type="button" onClick={addChannel} className="btn btn-secondary btn-xs">{t("addChannel")}</button>
              </h3>
              <fieldset className="space-y-3">
                <div className="space-y-3">
                  {contacts.channels.map((ch, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select value={ch.type} onChange={e => updateChannel(i, "type", e.target.value)} className="rounded border border-neutral-300 px-2 py-1 text-xs">
                        <option value="link">Link</option>
                        <option value="phone">Phone</option>
                        <option value="email">Email</option>
                        <option value="line">Line</option>
                      </select>
                      <input value={ch.value} placeholder="Value" onChange={e => updateChannel(i, "value", e.target.value)} className="flex-1 rounded border border-neutral-300 px-2 py-1 text-xs" />
                      <button type="button" onClick={() => removeChannel(i)} className="btn btn-ghost btn-xs">✕</button>
                    </div>
                  ))}
                  {!contacts.channels.length && <div className="text-[11px] text-neutral-400">No channels yet</div>}
                </div>
              </fieldset>
            </section>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn btn-primary btn-md">{loadingTranslation && activeLocale !== defaultLocale ? "..." : "Save"}</button>
            {activeLocale !== defaultLocale && <button type="button" onClick={() => { setTrDisplayName(""); setTrBio(""); setCtaLabelTr(""); }} className="text-xs underline text-neutral-500">Reset EN</button>}
          </div>
        </form>
      </div>
      {iconPickerOpen && (
        <IconPicker value={ctaConfig.icon} onChange={(name) => setCtaConfig((c) => ({ ...c, icon: name || "" }))} onClose={() => setIconPickerOpen(false)} />
      )}
    </div>
  );
}
