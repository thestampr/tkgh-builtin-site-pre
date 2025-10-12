"use client";

import Disclosure from "@/components/common/Disclosure";
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
  const tCommon = useTranslations("Common");
  const locale = useLocale();

  return (
    <div className="w-full flex-1">
      <div className="hidden md:block">
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
                  <td className="px-2 font-medium text-neutral-800 max-w-[280px] truncate">{tr?.title || it.title}</td>
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
      </div>
      {/* Mobile view */}
      <div className="space-y-2 md:hidden">
        {items.length === 0 ? (
          <div className="py-6 text-center text-neutral-500">{t("empty")}</div>
        ) : (
          <div>
            <div className="text-left text-xs uppercase tracking-wide text-neutral-500 flex items-center gap-2 px-3 mb-2">
              <div className="w-20">Imgs</div>
              <div className="flex-1">{t("fields.title")}</div>
            </div>
            {items.map(it => {
              const gallery: string[] = (it.galleryJson ? JSON.parse(it.galleryJson as string) : it.gallery) || [];
              const tr = it.translations?.find(tr => tr.locale === locale);
              const isPublished = it.status === "PUBLISHED";

              return (
                <Disclosure key={it.id} toggleOnLabelClick label={
                  <div className="flex items-center gap-1 w-full pl-2">
                    {/* <input
                type="checkbox"
                checked={false}
                onChange={() => {}}
                onClick={(e) => e.stopPropagation()}
                className="mr-2"
              /> */}
                    <ImageAvatars coverImage={it.coverImage} gallery={gallery} className="w-20" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">{tr?.title || it.title}</div>
                      <div className="flex flex-1 text-[11px]">
                        <PublishToggleButton
                          className="!bg-transparent !p-0 !px-0 !border-0 !text-left"
                          status={isPublished}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                }>
                  <div className="pt-2 text-xs text-gray-700">
                    {tr?.title || it.title}
                    <div className="mt-2 text-[10px] text-neutral-500 space-y-0.5">
                      <div>{t("fields.langs")}: {it.languages || defaultLocale}</div>
                      <div>Views: {it.viewCount ?? 0}</div>
                      <div>Favs: {it._count?.favorites ?? 0}</div>
                      <div>Updated: {new Date(it.updatedAt).toLocaleDateString()}</div>
                    </div>
                    <hr className="my-2 border-divider" />
                    <div className="w-full flex gap-2">
                      <PublishToggleButton status={isPublished} onClick={() => onTogglePublish(it)} className="mr-auto" />
                      <button onClick={() => onEdit(it)} className="btn btn-ghost btn-xs">{tCommon("edit")}</button>
                      <button onClick={() => onDelete(it)} className="btn btn-ghost btn-danger btn-xs">{tCommon("delete")}</button>
                    </div>
                  </div>
                </Disclosure>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
