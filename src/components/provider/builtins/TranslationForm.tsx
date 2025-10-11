"use client";

import MarkdownEditor from "@/components/common/MarkdownEditor";
import { useTranslations } from "next-intl";
import React from "react";
import type { TranslationDraft } from "./types";

interface TranslationFormProps {
  value: TranslationDraft;
  onChange: (patch: Partial<TranslationDraft>) => void;
  localeLabel: string;
  className?: string;
}

export const TranslationForm: React.FC<TranslationFormProps> = ({ value, onChange, localeLabel, className = "" }) => {
  const t = useTranslations("ProviderBuiltIns");

  return (
    <div className={`space-y-5 ${className}`}>
      <div className="space-y-1">
        <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.title")} ({localeLabel})</label>
        <input
          value={value.title || ""}
          onChange={e => onChange({ ...value, title: e.target.value })}
          className="w-full input input-secondary text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.price")} ({localeLabel})</label>
          <input
            type="number"
            value={value.price ?? ""}
            onChange={e => onChange({ ...value, price: e.target.value ? parseInt(e.target.value, 10) : null })}
            className="w-full input input-secondary text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.currency") || "Currency"} ({localeLabel})</label>
            <select
              value={value.currency || ""}
              onChange={e => onChange({ ...value, currency: e.target.value || null })}
              className="w-full input input-secondary text-sm"
            >
              <option value="">—</option>
              <option value="THB">THB</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="JPY">JPY</option>
            </select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="block text-[11px] uppercase tracking-wide text-neutral-500">Content ({localeLabel})</label>
        <MarkdownEditor
          className="w-full resize-y overscroll-contain min-h-[500px]"
          value={value.content || ""}
          onChange={content => onChange({ ...value, content })}
        />
      </div>
      <label className="inline-flex items-center gap-2 text-xs text-neutral-600">
        <input
          type="checkbox"
          checked={!!value.published}
          onChange={e => onChange({ ...value, published: e.target.checked })}
        /> {`Published (${localeLabel})`}
      </label>
    </div>
  );
};
