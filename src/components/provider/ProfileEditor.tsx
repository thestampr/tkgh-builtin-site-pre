"use client";

import { IconPicker, getIcon } from "@/components/IconPicker";
import { LocaleTabs } from "@/components/LocaleTabs";
import type { CTAConfig } from "@/components/ProviderCTA";
import { ProviderCTA } from "@/components/ProviderCTA";
import UserAvatar from "@/components/common/UserAvatar";
import { useToast } from "@/hooks/useToast";
import { defaultLocale, locales } from "@/i18n/navigation";
import { useProfileService, type InitialProfileRecord } from "@/services/useProfileService";
import clsx from "clsx";
import { Plus, Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Props {
  initialProfile: InitialProfileRecord | null;
}

function normalizeHex(v: string) {
  let val = v.trim();
  if (!val) return "";
  if (!val.startsWith("#")) val = "#" + val;
  val = val.replace(/[^#0-9a-fA-F]/g, "");
  if (val.length > 7) val = val.slice(0, 7);
  return val;
}
function isValidFullHex(v: string) {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}

export default function ProfileEditor({ initialProfile }: Props) {
  const t = useTranslations("Account.ui");
  const tProfile = useTranslations("Profile");
  const { showToast, removeToast, showSuccessToast, showErrorToast, updateToast } = useToast();

  const {
    profile,
    translations,
    avatar,
    cover,
    isDirty,
    isDirtyFor,
    isSaving,
    updateBase,
    addChannel,
    updateChannel,
    removeChannel,
    updateTranslation,
    ensureTranslationLoaded,
    resetLocale,
    chooseAvatar,
    chooseCover,
    updateProfile,
  } = useProfileService(initialProfile);

  const [activeLocale, setActiveLocale] = useState<string>(defaultLocale);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [toastId, setToastId] = useState<string | null>(null);
  const [textColorHex, setTextColorHex] = useState<string>(profile.ctaConfig.textColor || "#ffffff");
  const [bgColorHex, setBgColorHex] = useState<string>(profile.ctaConfig.color || "#8a6a40");
  // Keep latest save/cancel callbacks available to the toast without recreating it
  const saveRef = useRef<() => void>(() => { });
  const resetRef = useRef<() => void>(() => { });

  // Keep local HEX inputs in sync
  useEffect(() => { setTextColorHex(profile.ctaConfig.textColor || "#ffffff"); }, [profile.ctaConfig.textColor]);
  useEffect(() => { setBgColorHex(profile.ctaConfig.color || "#8a6a40"); }, [profile.ctaConfig.color]);

  const handleHexChange = useCallback((kind: "textColor" | "color", raw: string) => {
    const normalized = normalizeHex(raw);
    if (kind === "textColor") {
      setTextColorHex(normalized);
      if (isValidFullHex(normalized)) updateBase({ ctaConfig: { ...profile.ctaConfig, textColor: normalized } as CTAConfig });
    } else {
      setBgColorHex(normalized);
      if (isValidFullHex(normalized)) updateBase({ ctaConfig: { ...profile.ctaConfig, color: normalized } as CTAConfig });
    }
  }, [profile.ctaConfig, updateBase]);

  const dirtyAny = isDirty; // any locale or base changed
  const dirtyActive = useMemo(() => isDirtyFor(activeLocale), [isDirtyFor, activeLocale]);

  // When switching locales, lazily load translations
  useEffect(() => {
    if (activeLocale !== defaultLocale) {
      ensureTranslationLoaded(activeLocale);
    }
  }, [activeLocale, ensureTranslationLoaded]);

  const resetAll = useCallback(() => {
    locales.forEach((loc) => {
      resetLocale(loc);
    });
  }, [resetLocale, locales]);

  // Avatar / Cover file input handlers to enforce type/size then set into service
  const onAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (["image/png", "image/jpeg", "image/webp"].includes(file.type) === false) { setErrors((er) => [...er, "TYPE"]); return; }
    if (file.size > 512 * 1024) { setErrors((er) => [...er, "SIZE"]); return; }
    chooseAvatar(file);
  }, [chooseAvatar]);

  const onCoverChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setErrors((er) => [...er, "TYPE"]); return; }
    if (file.size > 1024 * 1024) { setErrors((er) => [...er, "SIZE"]); return; }
    chooseCover(file);
  }, [chooseCover]);

  const save = async () => {
    try {
      await updateProfile();
      showSuccessToast({ title: t("saved") });
    } catch (e) {
      showErrorToast({ title: t("saveFailed") });
    }
  };
  // Update refs so the toast always invokes the latest functions/state
  useEffect(() => { saveRef.current = () => { void save(); }; }, [save]);
  useEffect(() => { resetRef.current = () => resetAll(); }, [resetAll]);

  const LocaleLabel = useCallback(() => {
    if (activeLocale === defaultLocale) return null;
    return (<div className="ml-auto text-xs font-normal text-neutral-400">{activeLocale}</div>);
  }, [activeLocale]);

  // Handlers without inline logic for inputs/buttons
  const handleDisplayNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (activeLocale === defaultLocale) updateBase({ displayName: v });
    else updateTranslation(activeLocale, { displayName: v });
  }, [activeLocale, updateBase, updateTranslation]);

  const handleBioChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    if (activeLocale === defaultLocale) updateBase({ bio: v });
    else updateTranslation(activeLocale, { bio: v });
  }, [activeLocale, updateBase, updateTranslation]);

  const handleCtaLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateBase({ ctaConfig: { ...profile.ctaConfig, label: e.target.value } });
  }, [profile.ctaConfig, updateBase]);

  const handleCtaHrefChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateBase({ ctaConfig: { ...profile.ctaConfig, href: e.target.value } });
  }, [profile.ctaConfig, updateBase]);

  const onTextColorPickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toUpperCase();
    setTextColorHex(v);
    updateBase({ ctaConfig: { ...profile.ctaConfig, textColor: v } });
  }, [profile.ctaConfig, updateBase]);

  const onBgColorPickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toUpperCase();
    setBgColorHex(v);
    updateBase({ ctaConfig: { ...profile.ctaConfig, color: v } });
  }, [profile.ctaConfig, updateBase]);

  const onTextHexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleHexChange("textColor", e.target.value.toUpperCase());
  }, [handleHexChange]);

  const onBgHexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleHexChange("color", e.target.value.toUpperCase());
  }, [handleHexChange]);

  const handleCtaSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateBase({ ctaConfig: { ...profile.ctaConfig, size: e.target.value } });
  }, [profile.ctaConfig, updateBase]);

  const handleOpenIconPicker = useCallback(() => setIconPickerOpen(true), []);
  const handleClearIcon = useCallback(() => { updateBase({ ctaConfig: { ...profile.ctaConfig, icon: "" } }); }, [profile.ctaConfig, updateBase]);

  const handleCtaStyleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateBase({ ctaConfig: { ...profile.ctaConfig, style: e.target.value } });
  }, [profile.ctaConfig, updateBase]);

  const handleCtaRadiusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateBase({ ctaConfig: { ...profile.ctaConfig, radius: e.target.value } });
  }, [profile.ctaConfig, updateBase]);

  const handleAddChannel = useCallback(() => addChannel(), [addChannel]);
  const handleChannelChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const index = Number((e.currentTarget as HTMLElement).dataset.index);
    const field = ((e.currentTarget as HTMLElement).dataset.field || "value") as "type" | "value";
    const value = (e.target as HTMLInputElement).value;
    updateChannel(index, field, value);
  }, [updateChannel]);
  const handleChannelRemove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const index = Number((e.currentTarget as HTMLElement).dataset.index);
    removeChannel(index);
  }, [removeChannel]);

  const handleChooseImageClick = useCallback(() => { /* no-op: label clicks input */ }, []);
  const handleClearAvatar = useCallback(() => { chooseAvatar(null); updateBase({ avatarUrl: null }); }, [chooseAvatar, updateBase]);
  const handleClearCover = useCallback(() => { chooseCover(null); updateBase({ coverImage: null }); }, [chooseCover, updateBase]);

  const handleChangeLocale = useCallback((loc: string) => setActiveLocale(loc), []);

  const handleCtaLabelTrChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateTranslation(activeLocale, { ctaLabel: e.target.value });
  }, [activeLocale, updateTranslation]);

  const ctaIconEl = useMemo(() => {
    const name = profile.ctaConfig.icon;
    if (!name) return null;
    return getIcon(name, { size: 16, className: "mx-1" });
  }, [profile.ctaConfig.icon]);

  const handleIconPicked = useCallback((name?: string | null) => {
    updateBase({ ctaConfig: { ...profile.ctaConfig, icon: name || "" } });
  }, [profile.ctaConfig, updateBase]);
  const handleCloseIconPicker = useCallback(() => setIconPickerOpen(false), []);

  // Floating save toast when dirty
  const Toast = () => {
    const disabled = isSaving || !dirtyAny;
    return (
      <div className="p-[1.5px] bg-gradient-to-br from-blue-300 to-pink-300 rounded-2xl shadow-xl">
        <div className="flex items-center bg-white rounded-[14px] p-3 m-px">
          <div className="flex-1 min-w-0 text-sm truncate">{t("unsaved")}</div>
          <div className="ml-3 flex items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => resetRef.current()}
              className="btn btn-ghost btn-sm"
            >
              {t("reset")}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => saveRef.current()}
              className="btn btn-accent btn-sm"
            >
              {isSaving ? t("saving") : t("saveChanges")}
            </button>
          </div>
        </div>
      </div>
    );
  }
  useEffect(() => {
    if (!dirtyAny) {
      if (toastId) removeToast(toastId);
      setToastId(null);
      return;
    }
    if (!toastId) {
      const id = showToast({
        pin: true,
        dismissible: false,
        style: { maxWidth: 600 },
        position: "bottom",
        direction: "up-down",
        className: "!p-4 !-m-4 !gap-0 !border-none !w-screen !translate-x-0 !left-0 !bg-transparent !shadow-none",
        content: <Toast />,
      });
      setToastId(id);
    }
  }, [dirtyAny, showToast, removeToast, t, toastId, resetAll, save, isSaving]);
  useEffect(() => {
    if (!toastId) return;
    if (!isSaving) return;
    updateToast(toastId, {
      pin: false,
      content: <Toast />,
    });
  }, [toastId, isSaving]);

  const currentTr = translations[activeLocale] || { displayName: "", bio: "", ctaLabel: "" };

  const sectionLabelClass = "text-xs font-semibold tracking-wide uppercase flex";
  const labelClass = "block text-[11px] tracking-wide text-neutral-500";

  return (
    <div className="max-w-5xl mx-auto md:px-6 pb-10 space-y-10">
      <div className="flex flex-col gap-4 max-w-2xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#8a6a40] via-[#a4814f] to-[#8a6a40]">{tProfile("title")}</h1>
            <p className="text-sm text-neutral-500 mt-1">{tProfile("subtitle")}</p>
          </div>
          <LocaleTabs className="ml-auto" locales={locales} active={activeLocale} onChange={handleChangeLocale} />
        </div>
      </div>

      <div className="grid max-w-2xl gap-10">
        {!!errors.length && (
          <ul className="text-xs text-danger space-y-1">
            {errors.map((e) => (
              <li key={e}>{e === "TYPE" ? "Invalid file type" : e === "SIZE" ? "File too large (512KB max)" : e}</li>
            ))}
          </ul>
        )}
        <form className="space-y-6">
          {activeLocale !== defaultLocale && (
            <div className="rounded-md border border-warning bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
              {t("editingLocale")} <strong>{activeLocale}</strong>
            </div>
          )}

          <div className="space-y-6">
            {activeLocale === defaultLocale && (
              <>
                <section className="card">
                  <h3 className={sectionLabelClass}>{t("avatar") || "Avatar"}</h3>
                  <fieldset className="grid grid-cols-3 items-center">
                    <label htmlFor="avatar-upload" className="flex flex-row items-center justify-start gap-4 cursor-pointer col-span-2">
                      <UserAvatar src={avatar.previewUrl || profile.avatarUrl || undefined} sessionUser={false} size={80} name={profile.displayName} />
                      <div className="text-neutral-500 text-xs">{t("userProfile.clickToUpload")}</div>
                      <input id="avatar-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={onAvatarChange} className="hidden" />
                    </label>
                    <div className="flex flex-col items-start gap-2">
                      {(profile.avatarUrl || avatar.file) && (
                        <button type="button" onClick={handleClearAvatar} className="text-btn text-danger text-xs">
                          {t("removeImage") || "Remove"}
                        </button>
                      )}
                    </div>
                  </fieldset>
                </section>

                <section className="card">
                  <h3 className={sectionLabelClass}>{t("coverImage") || "Cover Image"}</h3>
                  <fieldset className="space-y-3">
                    <label className="text-neutral-500 flex flex-col gap-1" htmlFor="cover-image-input">
                      <span className="aspect-[16/6] w-full rounded-lg overflow-hidden bg-neutral-100 border border-neutral-300 cursor-pointer">
                        {cover.previewUrl || profile.coverImage ? (
                          <img src={(cover.previewUrl || profile.coverImage) as string} alt="cover" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-500 gap-2">
                            <strong>{t("coverImage")}</strong> — {t("userProfile.clickToUpload")}
                          </div>
                        )}
                      </span>
                    </label>
                    <div className="flex items-center gap-3">
                      <label htmlFor="cover-image-input" className="btn btn-ghost btn-xs cursor-pointer" onClick={handleChooseImageClick}>{t("chooseImage") || "Choose Image"}</label>
                      {(profile.coverImage || cover.file) && (
                        <button type="button" onClick={handleClearCover} className="text-btn text-danger text-xs">
                          {t("removeImage") || "Remove"}
                        </button>
                      )}
                    </div>
                    <input id="cover-image-input" type="file" accept="image/*" className="hidden" onChange={onCoverChange} />
                  </fieldset>
                </section>
              </>
            )}

            <section className="card">
              <h3 className={sectionLabelClass}>{t("basicInfo") || "Basic Info"}<LocaleLabel /></h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className={labelClass}>Display Name</label>
                  <input value={activeLocale === defaultLocale ? profile.displayName : currentTr.displayName} onChange={handleDisplayNameChange} className="w-full input input-secondary" />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Bio</label>
                  <textarea value={activeLocale === defaultLocale ? profile.bio : currentTr.bio} onChange={handleBioChange} className="w-full input input-secondary resize-y min-h-32" />
                </div>
              </div>
            </section>

            {activeLocale === defaultLocale ? (
              <>
                <section className="card">
                  <h3 className={sectionLabelClass}>{t("cta") || "CTA Button"}</h3>
                  <fieldset className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className={labelClass}>Label</label>
                        <input value={profile.ctaConfig.label || ""} onChange={handleCtaLabelChange} className="w-full input input-secondary text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className={labelClass}>Href</label>
                        <input value={profile.ctaConfig.href || ""} onChange={handleCtaHrefChange} className="w-full input input-secondary text-sm" />
                      </div>
                      <div>
                        <label className={labelClass}>Label Color</label>
                        <div className="flex items-center gap-2 relative mt-1">
                          <label htmlFor="text-color-input" className="h-9 w-9 input cursor-pointer" style={{ backgroundColor: isValidFullHex(textColorHex) ? textColorHex : (profile.ctaConfig.textColor || "#FFFFFF") }} />
                          <input value={textColorHex} onChange={onTextHexChange} placeholder="#FFFFFF" className={clsx("w-24 input text-sm font-mono uppercase flex-1", isValidFullHex(textColorHex) ? "input-secondary" : "input-warning")} />
                          <input id="text-color-input" type="color" value={isValidFullHex(textColorHex) ? textColorHex : (profile.ctaConfig.textColor || "#FFFFFF")} onChange={onTextColorPickerChange} className="pointer-events-none opacity-0 absolute bottom-0" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className={labelClass}>Color</label>
                        <div className="flex items-center gap-2 relative mt-1">
                          <label htmlFor="bg-color-input" className="h-9 w-9 input cursor-pointer" style={{ backgroundColor: isValidFullHex(bgColorHex) ? bgColorHex : (profile.ctaConfig.color || "#8A6A40") }} />
                          <input value={bgColorHex} onChange={onBgHexChange} placeholder="#8A6A40" className={clsx("w-24 input text-sm font-mono uppercase flex-1", isValidFullHex(bgColorHex) ? "input-secondary" : "input-warning")} />
                          <input id="bg-color-input" type="color" value={isValidFullHex(bgColorHex) ? bgColorHex : (profile.ctaConfig.color || "#8A6A40")} onChange={onBgColorPickerChange} className="pointer-events-none opacity-0 absolute bottom-0" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className={labelClass}>Size</label>
                        <select value={profile.ctaConfig.size || "md"} onChange={handleCtaSizeChange} className="w-full input input-secondary text-sm">
                          <option value="sm">Small</option>
                          <option value="md">Medium</option>
                          <option value="lg">Large</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className={labelClass}>Icon</label>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={handleOpenIconPicker} className="input text-sm inline-flex gap-2 items-center btn-ghost flex-1 cursor-pointer !ring-0 h-10">
                            {ctaIconEl}
                            <span>{profile.ctaConfig.icon || "Pick"}</span>
                          </button>
                          {profile.ctaConfig.icon && (<button type="button" onClick={handleClearIcon} className="btn btn-ghost btn-xs">✕</button>)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className={labelClass}>Style</label>
                        <select value={profile.ctaConfig.style || "solid"} onChange={handleCtaStyleChange} className="w-full input input-secondary text-sm">
                          <option value="solid">Solid</option>
                          <option value="outline">Outline</option>
                          <option value="ghost">Ghost</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className={labelClass}>Radius</label>
                        <select value={profile.ctaConfig.radius || "full"} onChange={handleCtaRadiusChange} className="w-full input input-secondary text-sm">
                          <option value="sm">Small</option>
                          <option value="md">Medium</option>
                          <option value="lg">Large</option>
                          <option value="full">Full</option>
                        </select>
                      </div>
                    </div>
                    <br />
                    <div className="pt-2">
                      <label className={labelClass}>Preview</label>
                      <div className="h-52 flex items-center justify-center bg-neutral-100 rounded-lg">
                        <ProviderCTA config={profile.ctaConfig} preview />
                      </div>
                    </div>
                    <div className="flex gap-4 text-[10px] text-neutral-500 pt-1">
                      <div className="flex items-center gap-1">
                        <span className={clsx("inline-block w-2 h-2 rounded-full", isValidFullHex(textColorHex) ? "bg-success" : "bg-warning")} />
                        <span>Label HEX</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={clsx("inline-block w-2 h-2 rounded-full", isValidFullHex(bgColorHex) ? "bg-success" : "bg-warning")} />
                        <span>Color HEX</span>
                      </div>
                    </div>
                  </fieldset>
                </section>

                <section className="card">
                  <div className="flex items-center justify-between">
                    <h3 className={sectionLabelClass}>{t("contactChannels")}</h3>
                    <button type="button" onClick={handleAddChannel} className="btn btn-secondary btn-xs">
                      <Plus size={14} />
                      {t("addChannel")}
                    </button>
                  </div>
                  <fieldset className="space-y-3">
                    <div className="space-y-3">
                      {profile.contacts.channels.map((ch, i) => (
                        <div key={`${ch.type}-${i}`} className="flex items-center gap-2">
                          <select value={ch.type} data-index={i} data-field="type" onChange={handleChannelChange} className="input input-secondary text-xs">
                            <option value="link">Link</option>
                            <option value="phone">Phone</option>
                            <option value="email">Email</option>
                            <option value="line">Line</option>
                          </select>
                          <input value={ch.value} placeholder="Value" data-index={i} data-field="value" onChange={handleChannelChange} className="flex-1 input input-secondary text-xs" />
                          <button type="button" data-index={i} onClick={handleChannelRemove} className="btn btn-ghost btn-xs">✕</button>
                        </div>
                      ))}
                      {!profile.contacts.channels.length && <div className="text-[11px] text-neutral-400">No channels yet</div>}
                    </div>
                  </fieldset>
                </section>
              </>
            ) : (
              <section className="card">
                <h3 className={sectionLabelClass}>CTA Label <LocaleLabel /></h3>
                <fieldset className="space-y-3">
                  <legend className="sr-only">CTA Label EN</legend>
                  <input value={currentTr.ctaLabel} onChange={handleCtaLabelTrChange} className="w-full input input-secondary text-sm" />
                </fieldset>
              </section>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            {activeLocale !== defaultLocale && (
              <button type="button" onClick={() => resetLocale(activeLocale)} disabled={!dirtyActive} className={clsx("btn btn-sm", !dirtyActive ? "btn-ghost" : "btn-danger")}>
                <Trash size={16} /> {t("reset")} — {activeLocale.toUpperCase()}
              </button>
            )}
          </div>
        </form>
      </div>
      {iconPickerOpen && (
        <IconPicker value={profile.ctaConfig.icon} onChange={handleIconPicked} onClose={handleCloseIconPicker} />
      )}
    </div>
  );
}
