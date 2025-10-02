"use client";

import { useTranslations } from "next-intl";
import React from "react";
import type { EstimateSort, ViewedFilter } from "./types";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  viewed: ViewedFilter;
  onViewedChange: (v: ViewedFilter) => void;
  sort: EstimateSort;
  onSortChange: (v: EstimateSort) => void;
  className?: string;
}

export const FilterBar: React.FC<Props> = ({ search, onSearchChange, viewed, onViewedChange, sort, onSortChange, className = "" }) => {
  const t = useTranslations("ProviderEstimates");

  return (
    <div className={`rounded-lg border border-neutral-200 bg-white/60 backdrop-blur-sm px-4 py-3 flex flex-col gap-3 md:flex-row md:items-end md:gap-4 text-[11px] ${className}`}>
      <div className="flex-1 min-w-[200px]">
        <label className="block font-medium mb-1 text-neutral-600">{t("filters.search")}</label>
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={t("filters.searchPlaceholder")}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400/40"
        />
      </div>
      <div className="min-w-[150px]">
        <label className="block font-medium mb-1 text-neutral-600">{t("filters.status")}</label>
        <select
          value={viewed}
          onChange={e => onViewedChange(e.target.value as ViewedFilter)}
          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400/40"
        >
          <option value="ALL">{t("filters.all")}</option>
          <option value="unviewed">{t("status.new")}</option>
          <option value="viewed">{t("status.viewed")}</option>
        </select>
      </div>
      <div className="min-w-[160px]">
        <label className="block font-medium mb-1 text-neutral-600">{t("filters.sort")}</label>
        <select
          value={sort}
          onChange={e => onSortChange(e.target.value as EstimateSort)}
          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400/40"
        >
          <option value="created_desc">{t("filters.sortNewest")}</option>
          <option value="created_asc">{t("filters.sortOldest")}</option>
          <option value="name_asc">A-Z</option>
          <option value="name_desc">Z-A</option>
        </select>
      </div>
    </div>
  );
};
