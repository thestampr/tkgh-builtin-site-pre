"use client";

import { kebabcase } from "@/lib/formatting";
import { useTranslations } from "next-intl";
import React from "react";
import type { DraftShape } from "./types";

interface BaseLocaleFormProps {
  draft: DraftShape;
  onChange: (patch: Partial<DraftShape>) => void;
  editing: { id: string } | null;
  coverPreviewUrl?: string | null;
  onSelectCoverFile?: (file: File | null) => void;
  onRemoveCoverImage?: () => void;
}

export const BaseLocaleForm: React.FC<BaseLocaleFormProps> = ({ draft, onChange, editing, coverPreviewUrl, onSelectCoverFile, onRemoveCoverImage }) => {
  const t = useTranslations("ProviderCategories");

  const onNameChange = (name: string) => {
    const slug = kebabcase(draft.name);
    const touchedSlug = draft.slug !== slug;
    onChange({ name, slug: touchedSlug || editing ? draft.slug : kebabcase(name) });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.name")}</label>
          <input 
            value={draft.name} 
            onChange={e => onNameChange(e.target.value)}
            className="w-full input input-secondary input-sm" />
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] uppercase tracking-wide text-neutral-500">slug</label>
          <input 
            value={draft.slug} 
            disabled={!!editing} 
            onChange={e => onChange({ slug: kebabcase(e.target.value) })}
            className="w-full input input-secondary input-sm disabled:opacity-60" />
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-xs text-neutral-600">
        <input type="checkbox" checked={!!draft.published} onChange={e => onChange({ published: e.target.checked })} /> {t("publish.published")}
      </label>

      <div className="space-y-2">
        <label className="text-neutral-500 flex flex-col gap-1" htmlFor="cover-image-input">
          <span className="text-[11px] uppercase tracking-wide">{t("fields.coverImage")}</span>
          <input
            id="cover-image-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onSelectCoverFile?.(e.target.files?.[0] || null)}
          />
          <span className="cursor-pointer">
            {(coverPreviewUrl || draft.coverImage) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreviewUrl || draft.coverImage || undefined} alt="cover" className="h-40 w-full object-cover rounded border border-neutral-200" />
            ) : (
              <div className="h-40 w-full rounded border border-dashed border-neutral-300 flex items-center justify-center text-[11px] text-neutral-400 bg-neutral-50">
                <span>{t("ui.noImage")}</span>
              </div>
            )}
          </span>
        </label>
        <div className="flex items-center gap-2">
          <label htmlFor="cover-image-input" className="btn btn-ghost btn-xs cursor-pointer">{t("ui.chooseImage") || "Choose Image"}</label>
          {(coverPreviewUrl || draft.coverImage) && (
            <button type="button" onClick={() => { onSelectCoverFile?.(null); onRemoveCoverImage?.(); }} className="text-btn text-danger text-xs">
              {t("ui.removeImage")}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.excerpt")}</label>
        <textarea value={draft.excerpt || ""} onChange={e => onChange({ excerpt: e.target.value })} rows={2} className="w-full input input-secondary !text-xs resize-none" placeholder={t("ui.shortTeaserPlaceholder")} />
      </div>
      <div className="space-y-1">
        <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.description")}</label>
        <textarea value={draft.description || ""} onChange={e => onChange({ description: e.target.value })} rows={5} className="w-full input input-secondary !text-xs resize-y" placeholder={t("ui.longerDescriptionPlaceholder")} />
      </div>
    </div>
  );
};
