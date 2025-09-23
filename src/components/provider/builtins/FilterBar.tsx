"use client";
import React from 'react';

import type { Category } from '@prisma/client';

interface FilterBarProps {
  query: string;
  onQueryChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  categoryFilter: string;
  onCategoryChange: (v: string) => void;
  sort: string;
  onSortChange: (v: string) => void;
  categories: Category[];
  t: (k: string) => string;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  query,
  onQueryChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  sort,
  onSortChange,
  categories,
  t,
  className = ''
}) => {
  return (
    <div className={`rounded-lg border border-neutral-200 bg-white/60 backdrop-blur-sm px-4 py-3 flex flex-col gap-3 md:flex-row md:items-end md:gap-4 text-[11px] ${className}`}>
      <div className="flex-1 min-w-[180px]">
        <label className="block font-medium mb-1 text-neutral-600">{t('filters.search')}</label>
        <input
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder={t('filters.searchPlaceholder')}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400/40"
        />
      </div>
      <div className="min-w-[140px]">
        <label className="block font-medium mb-1 text-neutral-600">{t('filters.status')}</label>
        <select
          value={statusFilter}
          onChange={e => onStatusChange(e.target.value)}
          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400/40"
        >
          <option value="ALL">{t('filters.all')}</option>
          <option value="PUBLISHED">{t('filters.published')}</option>
          <option value="DRAFT">{t('filters.draft')}</option>
        </select>
      </div>
      <div className="min-w-[160px]">
        <label className="block font-medium mb-1 text-neutral-600">{t('filters.category')}</label>
        <select
          value={categoryFilter}
          onChange={e => onCategoryChange(e.target.value)}
          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400/40"
        >
          <option value="">{t('filters.all')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="min-w-[160px]">
        <label className="block font-medium mb-1 text-neutral-600">{t('filters.sort')}</label>
        <select
          value={sort}
          onChange={e => onSortChange(e.target.value)}
          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400/40"
        >
          <option value="updated_desc">{t('filters.sortNewest')}</option>
          <option value="title_asc">{t('filters.sortTitle')}</option>
          <option value="title_desc">{t('filters.sortTitleDesc')}</option>
          <option value="views_desc">Views</option>
          <option value="favorites_desc">Favorites</option>
        </select>
      </div>
    </div>
  );
};
