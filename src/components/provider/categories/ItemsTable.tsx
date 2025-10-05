"use client";

import { defaultLocale } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import React from "react";
import type { CategoryDto } from "./types";
import { PublishToggleButton } from "@/components/common/PublishToggleButton";

interface ItemsTableProps {
  items: CategoryDto[];
  onEdit: (cat: CategoryDto) => void;
  onDelete: (cat: CategoryDto) => void;
  onTogglePublish: (item: CategoryDto) => void;
}

export const ItemsTable: React.FC<ItemsTableProps> = ({ 
  items, 
  onEdit, 
  onDelete, 
  onTogglePublish 
}) => {
  const t = useTranslations("ProviderCategories");
  const locale = useLocale();

  return (
    <table className="w-full text-sm border-separate border-spacing-y-2">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
          <th className="py-1 px-2">Img</th>
          <th className="py-1 px-2">{t("fields.name")}</th>
          <th className="py-1 px-2">Slug</th>
          <th className="py-1 px-2">Langs</th>
          <th className="py-1 px-2">{t("publish.published")}</th>
          <th className="py-1 px-2 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr>
            <td colSpan={8} className="py-6 text-center text-neutral-500">{t("empty")}</td>
          </tr>
        ) : items.map(cat => {
          const tr = cat.translations?.find(tr => tr.locale === locale);

          return (
            <tr key={cat.id} className="bg-white/70 backdrop-blur hover:bg-white/90 transition rounded shadow [&_td]:py-2">
              <td className="px-2">
                {cat.coverImage ? (
                  <img src={cat.coverImage} alt="thumb" className="h-8 w-8 rounded-full object-cover border border-neutral-300" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] text-neutral-500 border border-neutral-300">—</div>
                )}
              </td>
              <td className="px-2 font-medium text-neutral-800 max-w-[280px] truncate">{tr?.name || cat.name}</td>
              <td className="px-2 text-[11px] text-neutral-500">{cat.slug}</td>
              <td className="px-2 text-[11px] text-neutral-500">{cat.languages || defaultLocale}</td>
              <td className="px-2 text-xs">
                <PublishToggleButton
                  status={cat.published}
                  onClick={() => onTogglePublish(cat)}
                />
              </td>
              <td className="px-2 text-right text-xs space-x-3">
                <button onClick={() => onEdit(cat)} className="text-btn text-ghost text-xs">Edit</button>
                <button onClick={() => onDelete(cat)} className="text-btn text-danger text-xs">Delete</button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  );
};
