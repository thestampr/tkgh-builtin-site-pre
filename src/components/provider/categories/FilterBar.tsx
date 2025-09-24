"use client";

import React from "react";

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  published: "ALL" | "true" | "false";
  onPublishedChange: (v: "ALL" | "true" | "false") => void;
  sort: string;
  onSortChange: (v: string) => void;
  t: (k: string) => string;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  published,
  onPublishedChange,
  sort,
  onSortChange,
  t,
  className = ""
}) => {
  return (
    <div className={`rounded-lg border border-neutral-200 bg-white/60 backdrop-blur-sm px-4 py-3 flex flex-col gap-3 md:flex-row md:items-end md:gap-4 text-[11px] ${className}`}>
      <div className="flex-1 min-w-[180px]">
        <label className="block font-medium mb-1 text-neutral-600">{t("filters.search")}</label>
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={t("filters.searchPlaceholder")}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400/40"
        />
      </div>
      <div className="min-w-[150px]">
        <label className="block font-medium mb-1 text-neutral-600">{t("filters.published")}</label>
        <select
          value={published}
          onChange={e => onPublishedChange(e.target.value as FilterBarProps["published"])}
          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400/40"
        >
          <option value="ALL">{t("filters.all")}</option>
          <option value="true">{t("filters.published")}</option>
          <option value="false">{t("filters.unpublished")}</option>
        </select>
      </div>
      <div className="min-w-[160px]">
        <label className="block font-medium mb-1 text-neutral-600">{t("filters.sort")}</label>
        <select
          value={sort}
          onChange={e => onSortChange(e.target.value)}
          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400/40"
        >
          <option value="updated_desc">{t("filters.sortUpdated")}</option>
          <option value="name_asc">{t("filters.sortNameAsc")}</option>
          <option value="name_desc">{t("filters.sortNameDesc")}</option>
          <option value="created_desc">{t("filters.sortCreatedNewest")}</option>
          <option value="created_asc">{t("filters.sortCreatedOldest")}</option>
        </select>
      </div>
    </div>
  );
};
