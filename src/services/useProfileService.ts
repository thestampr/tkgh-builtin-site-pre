"use client";

import { defaultCta, type CTAConfig } from "@/components/ProviderCTA";
import { defaultLocale } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Single contact channel */
export interface Channel { 
  type: string; 
  value: string 
}

/** Contact channels container */
export interface ContactData { 
  channels: Channel[] 
}

/** Base profile data (default locale) */
export interface ProfileData {
  displayName: string;
  bio: string;
  contacts: ContactData;
  avatarUrl: string | null;
  coverImage: string | null;
  ctaConfig: CTAConfig;
}

/** Per-locale translation data */
export interface TranslationData {
  displayName: string;
  bio: string;
  ctaLabel: string; // empty string means inherit
}

/** Changes payload for a combined update */
export interface ProfileChanges extends Partial<ProfileData> {
  translations?: Record<string, Partial<TranslationData>>;
  avatarFile?: File | null;
  coverFile?: File | null;
}

/** Upload progress and preview state */
export interface UploadState {
  previewUrl: string | null;
  file: File | null;
  progress: number; // 0..100
}

/** Response shape returned from profile update API */
export interface UploadResponse {
  avatarUrl?: string | null;
  coverImage?: string | null;
  profile?: Partial<ProfileData> | null;
  translations?: Record<string, Partial<TranslationData>> | null;
}

/** Minimal shape of an incoming persisted profile record */
export interface InitialProfileRecord {
  displayName?: string | null;
  bio?: string | null;
  contactJson?: unknown; // accepts Prisma.JsonValue | string | null
  avatarUrl?: string | null;
  coverImage?: string | null;
  ctaJson?: unknown; // accepts Prisma.JsonValue | string | null
  translations?: Array<{
    locale: string;
    displayName?: string | null;
    bio?: string | null;
    ctaLabel?: string | null;
  }> | null;
}

/** Helper: safe JSON parse to typed return with fallback */
function parseJSON<T>(raw: unknown, fallback: T): T {
  if (raw === null || typeof raw === "undefined") return fallback;
  if (typeof raw === "string") {
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  }
  if (typeof raw === "object") {
    try { return raw as T; } catch { return fallback; }
  }
  return fallback;
}

/** Compare CTA shallowly by known keys */
function shallowEqualCTA(a: CTAConfig, b: CTAConfig): boolean {
  const keys: (keyof CTAConfig)[] = ["label", "href", "textColor", "color", "size", "icon", "style", "radius"];
  return keys.every((k) => (a[k] ?? "") === (b[k] ?? ""));
}

/** Compare contacts deeply by channels */
function contactsEqual(a: ContactData, b: ContactData): boolean {
  if (a.channels.length !== b.channels.length) return false;
  for (let i = 0; i < a.channels.length; i++) {
    const ca = a.channels[i];
    const cb = b.channels[i];
    if (!cb) return false;
    if (ca.type !== cb.type || ca.value !== cb.value) return false;
  }
  return true;
}

/** Deep clone helper to keep baselines immutable */
function deepClone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }

interface ServiceFlags { loading: boolean; error: string | null; isSaving: boolean }

/**
 * Centralized profile data service: manages base + translations state, change detection,
 * combined updates (fields + images) in a single API call, upload progress, and session updates.
 */
export function useProfileService(initial?: InitialProfileRecord | null) {
  const { update: updateSession } = useSession();

  const initialProfile: ProfileData = useMemo(() => ({
    displayName: initial?.displayName || "",
    bio: initial?.bio || "",
    contacts: parseJSON<ContactData>(initial?.contactJson ?? null, { channels: [] }),
    avatarUrl: initial?.avatarUrl || null,
    coverImage: initial?.coverImage || null,
    ctaConfig: (() => {
      const parsed = parseJSON<CTAConfig>(initial?.ctaJson ?? null, { ...defaultCta });
      if (!parsed.radius) parsed.radius = "full"; // normalize
      return parsed;
    })(),
  }), [initial]);

  const initialTranslationsMap: Record<string, TranslationData> = useMemo(() => {
    const map: Record<string, TranslationData> = {};
    const list = initial?.translations || [];
    for (const tr of list) {
      if (!tr?.locale) continue;
      map[tr.locale] = {
        displayName: tr.displayName || "",
        bio: tr.bio || "",
        ctaLabel: tr.ctaLabel || "",
      };
    }
    return map;
  }, [initial]);

  // Live state
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [translations, setTranslations] = useState<Record<string, TranslationData>>(initialTranslationsMap);

  // Baseline (last-saved) snapshots
  const [baseline, setBaseline] = useState<ProfileData>(deepClone(initialProfile));
  const [baselineTr, setBaselineTr] = useState<Record<string, TranslationData>>(deepClone(initialTranslationsMap));

  // Upload states
  const [avatar, setAvatar] = useState<UploadState>({ file: null, previewUrl: null, progress: 0 });
  const [cover, setCover] = useState<UploadState>({ file: null, previewUrl: null, progress: 0 });

  const [flags, setFlags] = useState<ServiceFlags>({ loading: false, error: null, isSaving: false });

  // Track if displayName or avatar changed for session update
  const lastSavedRef = useRef<{ displayName: string; avatarUrl: string | null }>({
    displayName: initialProfile.displayName,
    avatarUrl: initialProfile.avatarUrl,
  });

  /** Get translation object for locale, defaulting to empty fields */
  const getTranslation = useCallback((locale: string): TranslationData => {
    const t = translations[locale];
    return t ?? { displayName: "", bio: "", ctaLabel: "" };
  }, [translations]);

  /** Whether base locale is dirty compared to baseline */
  const baseDirty = useMemo(() => {
    if (profile.displayName !== baseline.displayName) return true;
    if (profile.bio !== baseline.bio) return true;
    if (!contactsEqual(profile.contacts, baseline.contacts)) return true;
    if (profile.avatarUrl !== baseline.avatarUrl) return true;
    if (profile.coverImage !== baseline.coverImage) return true;
    if (!shallowEqualCTA(profile.ctaConfig, baseline.ctaConfig)) return true;
    if (avatar.file || cover.file) return true;
    return false;
  }, [profile, baseline, avatar.file, cover.file]);

  /** Whether a translation locale is dirty compared to baseline */
  const isTranslationDirty = useCallback((locale: string): boolean => {
    const current = translations[locale] || { displayName: "", bio: "", ctaLabel: "" };
    const base = baselineTr[locale] || { displayName: "", bio: "", ctaLabel: "" };
    return (
      current.displayName !== base.displayName ||
      current.bio !== base.bio ||
      current.ctaLabel !== base.ctaLabel
    );
  }, [translations, baselineTr]);

  /** Overall dirty across base and all loaded translations */
  const isDirty = useMemo(() => {
    if (baseDirty) return true;
    return Object.keys(translations).some((loc) => isTranslationDirty(loc));
  }, [baseDirty, translations, isTranslationDirty]);

  /** Public: check dirty for a specific locale (default -> base) */
  const isDirtyFor = useCallback((locale: string): boolean => {
    return locale === defaultLocale ? baseDirty : isTranslationDirty(locale);
  }, [baseDirty, isTranslationDirty]);

  /** Update base fields */
  const updateBase = useCallback((patch: Partial<ProfileData>) => {
    setProfile((p) => {
      const next = { ...p, ...patch };
      return next;
    });
  }, []);

  /** Update contacts helpers */
  const addChannel = useCallback(() => {
    setProfile((p) => ({ ...p, contacts: { channels: [...p.contacts.channels, { type: "link", value: "" }] } }));
  }, []);
  const updateChannel = useCallback((index: number, field: keyof Channel, value: string) => {
    setProfile((p) => ({
      ...p,
      contacts: { channels: p.contacts.channels.map((ch, i) => (i === index ? { ...ch, [field]: value } : ch)) },
    }));
  }, []);
  const removeChannel = useCallback((index: number) => {
    setProfile((p) => ({ ...p, contacts: { channels: p.contacts.channels.filter((_, i) => i !== index) } }));
  }, []);

  /** Update translation fields for a locale */
  const updateTranslation = useCallback((locale: string, patch: Partial<TranslationData>) => {
    setTranslations((prev) => ({ ...prev, [locale]: { ...getTranslation(locale), ...patch } }));
  }, [getTranslation]);

  /** Set avatar file and preview */
  const chooseAvatar = useCallback((file: File | null) => {
    setAvatar((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return {
        file,
        progress: 0,
        previewUrl: file ? URL.createObjectURL(file) : null,
      };
    });
  }, []);

  /** Set cover file and preview */
  const chooseCover = useCallback((file: File | null) => {
    setCover((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return {
        file,
        progress: 0,
        previewUrl: file ? URL.createObjectURL(file) : null,
      };
    });
  }, []);

  useEffect(() => () => {
    if (avatar.previewUrl) URL.revokeObjectURL(avatar.previewUrl);
    if (cover.previewUrl) URL.revokeObjectURL(cover.previewUrl);
  }, []);

  /** Validate required fields and simple constraints */
  const validate = useCallback((): string[] => {
    const errors: string[] = [];
    profile.contacts.channels.forEach((ch, i) => { if (!ch.value.trim()) errors.push(`Channel #${i + 1} empty`); });
    return errors;
  }, [profile.contacts.channels]);

  /**
   * Compute changes across base and all loaded translations.
   * Only include fields that differ from baseline or present files to upload.
   */
  const computeChanges = (): ProfileChanges => {
    const patch: ProfileChanges = {};
    if (profile.displayName !== baseline.displayName) patch.displayName = profile.displayName;
    if (profile.bio !== baseline.bio) patch.bio = profile.bio;
    if (!contactsEqual(profile.contacts, baseline.contacts)) patch.contacts = deepClone(profile.contacts);
    if (profile.avatarUrl !== baseline.avatarUrl) patch.avatarUrl = profile.avatarUrl;
    if (profile.coverImage !== baseline.coverImage) patch.coverImage = profile.coverImage;
    if (!shallowEqualCTA(profile.ctaConfig, baseline.ctaConfig)) patch.ctaConfig = deepClone(profile.ctaConfig);
    if (avatar.file) patch.avatarFile = avatar.file;
    if (cover.file) patch.coverFile = cover.file;

    const trPatch: Record<string, Partial<TranslationData>> = {};
    Object.keys(translations).forEach((loc) => {
      const cur = translations[loc] || { displayName: "", bio: "", ctaLabel: "" };
      const base = baselineTr[loc] || { displayName: "", bio: "", ctaLabel: "" };
      const tp: Partial<TranslationData> = {};
      if (cur.displayName !== base.displayName) tp.displayName = cur.displayName;
      if (cur.bio !== base.bio) tp.bio = cur.bio;
      if (cur.ctaLabel !== base.ctaLabel) tp.ctaLabel = cur.ctaLabel;
      if (Object.keys(tp).length) trPatch[loc] = tp;
    });
    if (Object.keys(trPatch).length) patch.translations = trPatch;
    return patch;
  };

  /**
   * Load translation for a locale and establish its baseline if not yet loaded.
   */
  const ensureTranslationLoaded = useCallback(async (locale: string) => {
    if (locale === defaultLocale) return;
    if (translations[locale] && baselineTr[locale]) return; // already loaded
    const init: TranslationData = { displayName: "", bio: "", ctaLabel: "" };
    setTranslations((prev) => ({ ...prev, [locale]: init }));
    setBaselineTr((prev) => ({ ...prev, [locale]: deepClone(init) }));
  }, [translations, baselineTr]);

  /** Reset changes of a specific locale to baseline */
  const resetLocale = useCallback((locale: string) => {
    if (locale === defaultLocale) {
      setProfile(deepClone(baseline));
      setAvatar((a) => ({ ...a, file: null, previewUrl: null, progress: 0 }));
      setCover((c) => ({ ...c, file: null, previewUrl: null, progress: 0 }));
    } else {
      const base = baselineTr[locale] || { displayName: "", bio: "", ctaLabel: "" };
      setTranslations((prev) => ({ ...prev, [locale]: deepClone(base) }));
    }
  }, [baseline, baselineTr]);

  /**
   * Send combined update for all changed fields and locales in a single request.
   * If files present, send multipart/form-data with progress tracking.
   */
  const updateProfile = useCallback(async (changes?: ProfileChanges) => {
    const validation = validate();
    if (validation.length) {
      throw new Error(validation.join("\n"));
    }
    const patch = changes ?? computeChanges();
    if (!patch.avatarFile && !patch.coverFile && !patch.translations && Object.keys({ ...patch }).filter(k => (k !== "avatarFile" && k !== "coverFile" && k !== "translations")).length === 0) {
      return { ok: true } as const; // nothing to save
    }
    setFlags((s) => ({ ...s, isSaving: true, error: null }));

    const endpoint = "/api/provider/profile";

    try {
      let json: UploadResponse | null = null;

      const hasFiles = !!(patch.avatarFile || patch.coverFile);
      const payloadObj: Record<string, unknown> = {
        displayName: patch.displayName,
        bio: patch.bio,
        contactJson: typeof patch.contacts !== "undefined" ? JSON.stringify(patch.contacts) : undefined,
        avatarUrl: patch.avatarUrl,
        coverImage: patch.coverImage,
        ctaJson: typeof patch.ctaConfig !== "undefined" ? JSON.stringify(patch.ctaConfig) : undefined,
        translations: patch.translations && Object.keys(patch.translations).length ? patch.translations : undefined,
      };

      if (hasFiles) {
        const fd = new FormData();
        fd.append("payload", JSON.stringify(payloadObj));
        if (patch.avatarFile) fd.append("avatar", patch.avatarFile);
        if (patch.coverFile) fd.append("cover", patch.coverFile);

        // Use XHR to track progress; don't set Content-Type headers manually
        json = await new Promise<UploadResponse>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", endpoint);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              if (patch.avatarFile) setAvatar((a) => ({ ...a, progress: percent }));
              if (patch.coverFile) setCover((c) => ({ ...c, progress: percent }));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try { resolve(JSON.parse(xhr.responseText) as UploadResponse); }
              catch { resolve({}); }
            } else {
              reject(new Error(`HTTP ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(fd);
        });
      } else {
        const response = await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadObj),
        });
        if (!response.ok) throw new Error("Update failed");
        try { json = (await response.json()) as UploadResponse; } catch { json = {}; }
      }

      // Update local state and baselines optimistically
      if (typeof patch.displayName !== "undefined") profile.displayName = patch.displayName;
      if (typeof patch.bio !== "undefined") profile.bio = patch.bio;
      if (typeof patch.contacts !== "undefined") profile.contacts = deepClone(patch.contacts!);
      if (typeof patch.ctaConfig !== "undefined") profile.ctaConfig = deepClone(patch.ctaConfig!);
      if (patch.avatarFile && json?.avatarUrl) profile.avatarUrl = json.avatarUrl;
      if (patch.coverFile && json?.coverImage) profile.coverImage = json.coverImage;
      if (typeof patch.avatarUrl !== "undefined") profile.avatarUrl = patch.avatarUrl;
      if (typeof patch.coverImage !== "undefined") profile.coverImage = patch.coverImage;
      if (patch.translations) {
        const nextTr = { ...translations };
        Object.keys(patch.translations).forEach((loc) => {
          nextTr[loc] = { ...getTranslation(loc), ...patch.translations![loc] } as TranslationData;
        });
        setTranslations(nextTr);
      }
      setProfile({ ...profile });

      // Apply baselines
      const nextBaseline: ProfileData = deepClone(profile);
      setBaseline(nextBaseline);
      const nextBaselineTr = { ...baselineTr } as Record<string, TranslationData>;
      Object.keys(translations).forEach((loc) => {
        nextBaselineTr[loc] = deepClone(translations[loc]);
      });
      setBaselineTr(nextBaselineTr);

      // Clear file selections after save
      if (patch.avatarFile) setAvatar({ file: null, previewUrl: null, progress: 0 });
      if (patch.coverFile) setCover({ file: null, previewUrl: null, progress: 0 });

      // Trigger session update if needed
      const didChangeAvatar = (lastSavedRef.current.avatarUrl || null) !== (profile.avatarUrl || null);
      const didChangeName = lastSavedRef.current.displayName !== profile.displayName;
      if ((didChangeAvatar || didChangeName) && updateSession) {
        try { await updateSession(); } catch { /* ignore */ }
        lastSavedRef.current = { displayName: profile.displayName, avatarUrl: profile.avatarUrl };
      }

      return { ok: true } as const;
    } catch (e) {
      setFlags((s) => ({ ...s, error: e instanceof Error ? e.message : "Error" }));
      throw e;
    } finally {
      setFlags((s) => ({ ...s, isSaving: false }));
    }
  }, [validate, computeChanges, profile, translations, baselineTr, updateSession]);

  return {
    // state
    profile,
    translations,
    avatar,
    cover,
    isDirty,
    isDirtyFor,
    loading: flags.loading,
    error: flags.error,
    isSaving: flags.isSaving,
    // actions
    updateBase,
    addChannel,
    updateChannel,
    removeChannel,
    updateTranslation,
    ensureTranslationLoaded,
    resetLocale,
    chooseAvatar,
    chooseCover,
    computeChanges,
    updateProfile,
  };
}
