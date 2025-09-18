"use client";
import React from 'react';

interface TranslationDraft { title?: string; content?: string; price?: number | null; currency?: string | null; published?: boolean; }
interface TranslationFormProps {
  draft: TranslationDraft;
  onChange: (d: TranslationDraft) => void;
  t: (k: string) => string;
  localeLabel?: string; // e.g. EN
  className?: string;
}

export const TranslationForm: React.FC<TranslationFormProps> = ({ draft, onChange, t, localeLabel = 'EN', className = '' }) => {
  return (
    <div className={`space-y-5 ${className}`}>
      <div className="space-y-1">
        <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t('fields.title')} ({localeLabel})</label>
        <input
          value={draft.title || ''}
          onChange={e => onChange({ ...draft, title: e.target.value })}
          className="w-full border border-neutral-300 rounded px-2 py-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t('fields.price')} ({localeLabel})</label>
          <input
            type="number"
            value={draft.price ?? ''}
            onChange={e => onChange({ ...draft, price: e.target.value ? parseInt(e.target.value, 10) : null })}
            className="w-full border border-neutral-300 rounded px-2 py-1"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t('fields.currency') || 'Currency'} ({localeLabel})</label>
            <select
              value={draft.currency || ''}
              onChange={e => onChange({ ...draft, currency: e.target.value || null })}
              className="w-full border border-neutral-300 rounded px-2 py-1 bg-white"
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
        <textarea
          value={draft.content || ''}
          onChange={e => onChange({ ...draft, content: e.target.value })}
          rows={6}
          className="w-full border border-neutral-300 rounded px-2 py-2 text-xs"
        />
      </div>
      <label className="inline-flex items-center gap-2 text-xs text-neutral-600">
        <input
          type="checkbox"
          checked={!!draft.published}
          onChange={e => onChange({ ...draft, published: e.target.checked })}
        /> {`Published (${localeLabel})`}
      </label>
    </div>
  );
};
