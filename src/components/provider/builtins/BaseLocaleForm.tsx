"use client";

import type { Category } from '@prisma/client';
import React from 'react';
import { GalleryEditor } from './GalleryEditor';

interface DraftShape { title: string; slug: string; price: number | null; currency: string | null; categoryId: string | null; content: string | null; gallery: string[]; }
interface BaseLocaleFormProps {
  draft: DraftShape;
  onChange: (patch: Partial<DraftShape>) => void;
  categories: Category[];
  editing: { id: string } | null;
  t: (k: string) => string;
  uploadImages: (files: FileList | null) => void;
  slugify: (s: string) => string;
  className?: string;
}

export const BaseLocaleForm: React.FC<BaseLocaleFormProps> = ({ draft, onChange, categories, editing, t, uploadImages, slugify, className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t('fields.title')}</label>
          <input
            value={draft.title}
            onChange={e => onChange({ title: e.target.value, slug: editing ? draft.slug : slugify(e.target.value) })}
            className="w-full border border-neutral-300 rounded px-2 py-1"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t('fields.slug')}</label>
          <input
            value={draft.slug}
            disabled={!!editing}
            onChange={e => onChange({ slug: e.target.value.toLowerCase() })}
            className="w-full border border-neutral-300 rounded px-2 py-1 disabled:opacity-60"
          />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t('fields.price')}</label>
          <input
            type="number"
            value={draft.price ?? ''}
            onChange={e => onChange({ price: e.target.value ? parseInt(e.target.value, 10) : null })}
            className="w-full border border-neutral-300 rounded px-2 py-1"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t('fields.currency') || 'Currency'}</label>
          <select
            value={draft.currency || ''}
            onChange={e => onChange({ currency: e.target.value || null })}
            className="w-full border border-neutral-300 rounded px-2 py-1 bg-white"
          >
            <option value="">—</option>
            <option value="THB">THB</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="JPY">JPY</option>
          </select>
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t('fields.category')}</label>
          {categories.length ? (
            <select
              value={draft.categoryId || ''}
              onChange={e => onChange({ categoryId: e.target.value })}
              className="w-full border border-neutral-300 rounded px-2 py-1 bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          ) : (
            <div className="text-[11px] text-red-600">Create a category first.</div>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t('fields.content')}</label>
        <textarea
          value={draft.content || ''}
          onChange={e => onChange({ content: e.target.value })}
          rows={6}
          className="w-full border border-neutral-300 rounded px-2 py-2 text-xs"
        />
      </div>
      <GalleryEditor
        images={draft.gallery || []}
        onChange={imgs => onChange({ gallery: imgs })}
        onUpload={uploadImages}
        t={t}
      />
    </div>
  );
};
