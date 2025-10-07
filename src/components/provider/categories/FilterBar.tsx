"use client";

import { useTranslations } from "next-intl";
import React from "react";
import type { SortKind } from "./types";

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  published: "ALL" | "true" | "false";
  onPublishedChange: (v: "ALL" | "true" | "false") => void;
  sort: SortKind;
  onSortChange: (v: SortKind) => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  published,
  onPublishedChange,
  sort,
  onSortChange,
  className = ""
}) => {
  const t = useTranslations("ProviderCategories");

  const labelCls = "block font-medium mb-1 text-neutral-600";

  return (
    <div className={`rounded-lg border border-neutral-200 bg-white/60 backdrop-blur-sm px-4 py-3 flex flex-col gap-3 md:flex-row md:items-end md:gap-4 text-[11px] ${className}`}>
      <div className="flex-1 min-w-[180px]">
        <label className={labelCls}>{t("filters.search")}</label>
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={t("filters.searchPlaceholder")}
          className="w-full input text-xs"
        />
      </div>
      <div className="min-w-[150px]">
        <label className={labelCls}>{t("filters.published")}</label>
        <select
          value={published}
          onChange={e => onPublishedChange(e.target.value as FilterBarProps["published"])}
          className="w-full input text-xs"
        >
          <option value="ALL">{t("filters.all")}</option>
          <option value="true">{t("filters.published")}</option>
          <option value="false">{t("filters.unpublished")}</option>
        </select>
      </div>
      <div className="min-w-[160px]">
        <label className={labelCls}>{t("filters.sort")}</label>
        <select
          value={sort}
          onChange={e => onSortChange(e.target.value as SortKind)}
          className="w-full input text-xs"
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
