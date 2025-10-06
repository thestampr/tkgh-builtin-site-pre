"use client";

import { useTranslations } from "next-intl";
import React from "react";
import type { TranslationDraft } from "./types";

interface TranslationFormProps {
  value: TranslationDraft;
  onChange: (patch: Partial<TranslationDraft>) => void;
  localeLabel: string;
}

export const TranslationForm: React.FC<TranslationFormProps> = ({ value, onChange, localeLabel }) => {
  const t = useTranslations("ProviderCategories");

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.name")} ({localeLabel})</label>
        <input value={value.name || ""} onChange={e => onChange({ name: e.target.value })} className="w-full input input-secondary input-sm" />
      </div>
      <div className="space-y-1">
        <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.excerpt")} ({localeLabel})</label>
        <textarea rows={2} value={value.excerpt || ""} onChange={e => onChange({ excerpt: e.target.value })} className="w-full input input-secondary !text-xs resize-none" />
      </div>
      <div className="space-y-1">
        <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.description")} ({localeLabel})</label>
        <textarea rows={5} value={value.description || ""} onChange={e => onChange({ description: e.target.value })} className="w-full input input-secondary !text-xs resize-y" />
      </div>
      <label className="inline-flex items-center gap-2 text-xs text-neutral-600">
        <input type="checkbox" checked={!!value.published} onChange={e => onChange({ published: e.target.checked })} /> {t("publish.published")} ({localeLabel})
      </label>
    </div>
  );
};
