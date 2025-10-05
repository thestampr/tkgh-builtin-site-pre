"use client";

import { PublishToggleButton } from "@/components/common/PublishToggleButton";
import { useLocale, useTranslations } from "next-intl";
import React from "react";
import { ImageAvatars } from "./ImageAvatars";
import type { BuiltInDto } from "./types";

interface ItemsTableProps {
  items: BuiltInDto[];
  defaultLocale: string;
  onEdit: (item: BuiltInDto) => void;
  onDelete: (item: BuiltInDto) => void;
  onTogglePublish: (item: BuiltInDto) => void;
  className?: string;
}

export const ItemsTable: React.FC<ItemsTableProps> = ({
  items,
  defaultLocale,
  onEdit,
  onDelete,
  onTogglePublish,
  className = ""
}) => {
  const t = useTranslations("ProviderBuiltIns");
  const locale = useLocale();

  return (
    <table className={`w-full text-sm border-separate border-spacing-y-2 ${className}`}>
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
          <th className="py-1 px-2">Imgs</th>
          <th className="py-1 px-2">{t("fields.title")}</th>
          <th className="py-1 px-2">Langs</th>
          <th className="py-1 px-2">{t("status.published")}</th>
          <th className="py-1 px-2">Views</th>
          <th className="py-1 px-2">Favs</th>
          <th className="py-1 px-2">Updated</th>
          <th className="py-1 px-2 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr>
            <td colSpan={8} className="py-6 text-center text-neutral-500">{t("empty")}</td>
          </tr>
        ) : items.map(it => {
          const gallery = (it.galleryJson ? JSON.parse(it.galleryJson as string) : it.gallery) || [];
          const tr = it.translations?.find(tr => tr.locale === locale);

          return (
            <tr key={it.id} className="bg-white/70 backdrop-blur hover:bg-white/90 transition rounded shadow [&_td]:py-2">
              <td className="px-2">
                <ImageAvatars coverImage={it.coverImage} gallery={gallery} />
              </td>
              <td className="px-2 font-medium text-neutral-800 max-w-[280px] truncate">{ tr?.title || it.title}</td>
              <td className="px-2 text-[11px] text-neutral-500">{it.languages || defaultLocale}</td>
              <td className="px-2 text-xs">
                <PublishToggleButton
                  status={it.status === "PUBLISHED"}
                  onClick={() => onTogglePublish(it)}
                />
              </td>
              <td className="px-2 text-xs">
                <span className="inline-flex items-center rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700">
                  {it.viewCount ?? 0}
                </span>
              </td>
              <td className="px-2 text-xs">
                <span className="inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  {it._count?.favorites ?? 0}
                </span>
              </td>
              <td className="px-2 text-xs text-neutral-500">{new Date(it.updatedAt).toLocaleDateString()}</td>
              <td className="px-2 text-right text-xs space-x-3">
                <button onClick={() => onEdit(it)} className="text-btn text-ghost text-xs">Edit</button>
                <button onClick={() => onDelete(it)} className="text-btn text-danger text-xs">Delete</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
