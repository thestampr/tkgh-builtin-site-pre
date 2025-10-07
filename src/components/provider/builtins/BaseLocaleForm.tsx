"use client";

import { kebabcase } from "@/lib/formatting";
import type { Category } from "@prisma/client";
import { useTranslations } from "next-intl";
import React from "react";
import { GalleryEditor } from "./GalleryEditor";
import type { DraftShape } from "./types";

interface BaseLocaleFormProps {
  draft: DraftShape;
  onChange: (patch: Partial<DraftShape>) => void;
  categories: Category[];
  editing: { id: string } | null;
  uploadImages: (files: FileList | null) => void;
  className?: string;
}

export const BaseLocaleForm: React.FC<BaseLocaleFormProps> = ({ draft, onChange, categories, editing, uploadImages, className = "" }) => {
  const t = useTranslations("ProviderBuiltIns");

  const onTitleChange = (title: string) => {
    const slug = kebabcase(draft.title);
    const touchedSlug = draft.slug !== slug;
    onChange({ title, slug: touchedSlug || editing ? draft.slug : kebabcase(title) });
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.title")}</label>
          <input
            value={draft.title}
            onChange={e => onTitleChange(e.target.value)}
            className="w-full input input-secondary text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] uppercase tracking-wide text-neutral-500">slug</label>
          <input
            value={draft.slug}
            disabled={!!editing}
            onChange={e => onChange({ slug: kebabcase(e.target.value) })}
            className="w-full input input-secondary text-sm"
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1 md:col-span-2">
          <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.category")}</label>
          {categories.length ? (
            <select
              value={draft.categoryId || ""}
              onChange={e => onChange({ categoryId: e.target.value })}
              className="w-full input input-secondary text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          ) : (
            <div className="text-[11px] text-danger">Create a category first.</div>
          )}
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.price")}</label>
          <input
            type="number"
            value={draft.price ?? ""}
            onChange={e => onChange({ price: e.target.value ? parseInt(e.target.value, 10) : null })}
            className="w-full input input-secondary text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.currency") || "Currency"}</label>
          <select
            value={draft.currency || ""}
            onChange={e => onChange({ currency: e.target.value || null })}
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
        <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.content")}</label>
        <textarea
          value={draft.content || ""}
          onChange={e => onChange({ content: e.target.value })}
          rows={6}
          className="w-full input input-secondary !text-xs resize-y"
        />
      </div>
      <GalleryEditor
        images={draft.gallery || []}
        onChange={imgs => onChange({ gallery: imgs })}
        onUpload={uploadImages}
      />
    </div>
  );
};
