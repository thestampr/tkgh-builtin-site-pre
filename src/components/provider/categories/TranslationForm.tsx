"use client";

import { useTranslations } from "next-intl";
import React from "react";
import type { TranslationDraft } from "./types";

interface TranslationFormProps {
  value: TranslationDraft;
  onChange: (patch: Partial<TranslationDraft>) => void;
}

export const TranslationForm: React.FC<TranslationFormProps> = ({ value, onChange }) => {
  const t = useTranslations("ProviderCategories");

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.name")} (EN)</label>
        <input value={value.name || ""} onChange={e => onChange({ name: e.target.value })} className="w-full border border-neutral-300 rounded px-2 py-1" />
      </div>
      <div className="space-y-1">
        <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.excerpt")} (EN)</label>
        <textarea rows={2} value={value.excerpt || ""} onChange={e => onChange({ excerpt: e.target.value })} className="w-full border border-neutral-300 rounded px-2 py-2 text-xs" />
      </div>
      <div className="space-y-1">
        <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.description")} (EN)</label>
        <textarea rows={5} value={value.description || ""} onChange={e => onChange({ description: e.target.value })} className="w-full border border-neutral-300 rounded px-2 py-2 text-xs" />
      </div>
      <label className="inline-flex items-center gap-2 text-xs text-neutral-600">
        <input type="checkbox" checked={!!value.published} onChange={e => onChange({ published: e.target.checked })} /> {t("publish.published")} (EN)
      </label>
    </div>
  );
};
