"use client";

import type { BuiltInStatus, Category } from "@prisma/client";
import { useTranslations } from "next-intl";
import React from "react";
import type { FilterOptions, sortKind } from "./types";

interface FilterBarProps {
  query: string;
  onQueryChange: (v: string) => void;
  statusFilter: BuiltInStatus | "ALL";
  onStatusChange: (v: FilterOptions["status"]) => void;
  categoryFilter: string;
  onCategoryChange: (v: string) => void;
  sort: sortKind;
  onSortChange: (v: sortKind) => void;
  categories: Category[];
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
  className = ""
}) => {
  const t = useTranslations("ProviderBuiltIns");

  const labelCls = "block font-medium mb-1 text-neutral-600";

  return (
    <div className={`rounded-lg border border-neutral-200 bg-white/60 backdrop-blur-sm px-4 py-3 flex flex-col gap-3 md:flex-row md:items-end md:gap-4 text-[11px] ${className}`}>
      <div className="flex-1 min-w-[180px]">
        <label className={labelCls}>{t("filters.search")}</label>
        <input
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder={t("filters.searchPlaceholder")}
          className="w-full input text-xs"
        />
      </div>
      <div className="min-w-[140px]">
        <label className={labelCls}>{t("filters.status")}</label>
        <select
          value={statusFilter}
          onChange={e => onStatusChange(e.target.value as FilterOptions["status"])}
          className="w-full input text-xs"
        >
          <option value="ALL">{t("filters.all")}</option>
          <option value="PUBLISHED">{t("filters.published")}</option>
          <option value="DRAFT">{t("filters.draft")}</option>
        </select>
      </div>
      <div className="min-w-[160px]">
        <label className={labelCls}>{t("filters.category")}</label>
        <select
          value={categoryFilter}
          onChange={e => onCategoryChange(e.target.value)}
          className="w-full input text-xs"
        >
          <option value="">{t("filters.all")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="min-w-[160px]">
        <label className={labelCls}>{t("filters.sort")}</label>
        <select
          value={sort}
          onChange={e => onSortChange(e.target.value as sortKind)}
          className="w-full input text-xs"
        >
          <option value="updated_desc">{t("filters.sortNewest")}</option>
          <option value="title_asc">{t("filters.sortTitle")}</option>
          <option value="title_desc">{t("filters.sortTitleDesc")}</option>
          <option value="views_desc">Views</option>
          <option value="favorites_desc">Favorites</option>
        </select>
      </div>
    </div>
  );
};
