"use client";

import React from "react";
import type { EstimateDto } from "./types";

interface ItemsTableProps {
  items: EstimateDto[];
  t: (k: string) => string;
  onRowClick: (item: EstimateDto) => void;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}

export const ItemsTable: React.FC<ItemsTableProps> = ({ items, t, onRowClick, selectedIds, onToggle, onToggleAll }) => {
  const allSelected = items.length > 0 && items.every(i => selectedIds.has(i.id));
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-left text-neutral-500">
          <tr>
            <th className="py-2 pr-2 w-6">
              <input
                type="checkbox"
                aria-label={t("bulk.selectAll")}
                className="accent-neutral-800 cursor-pointer"
                checked={allSelected}
                onChange={onToggleAll}
              />
            </th>
            <th className="py-2 pr-4 w-32">{t("fields.createdAt")}</th>
            <th className="py-2 pr-4">{t("fields.name")}</th>
            <th className="py-2 pr-4">{t("fields.phone")}</th>
            <th className="py-2 pr-4">{t("fields.email")}</th>
            <th className="py-2 pr-4">{t("fields.category")}</th>
            <th className="py-2 pr-4">{t("fields.budget")}</th>
            <th className="py-2 pr-4">{t("fields.detail")}</th>
            <th className="py-2 pr-4 w-14 text-center">{t("fields.status")}</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={9} className="py-6 text-center text-neutral-500">{t("empty") || t("ui.noData")}</td>
            </tr>
          )}
          {items.map(it => (
            <tr
              key={it.id}
              className="border-t border-neutral-200/60 hover:bg-neutral-50 cursor-pointer transition"
              onClick={() => onRowClick(it)}
            >
              <td className="py-2 pr-2" onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox"
                  aria-label={t("bulk.selectOne")}
                  className="accent-neutral-800 cursor-pointer"
                  checked={selectedIds.has(it.id)}
                  onChange={() => onToggle(it.id)}
                />
              </td>
              <td className="py-2 pr-4 whitespace-nowrap text-xs text-neutral-600">{new Date(it.createdAt).toLocaleString()}</td>
              <td className="py-2 pr-4 font-medium text-neutral-800">{it.name}</td>
              <td className="py-2 pr-4 text-neutral-700">{it.phone}</td>
              <td className="py-2 pr-4 text-neutral-700">{it.email || '-'}</td>
              <td className="py-2 pr-4 text-neutral-700">{it.category?.name || '-'}</td>
              <td className="py-2 pr-4 text-neutral-700">{it.budget || '-'}</td>
              <td className="py-2 pr-4 max-w-[320px] truncate text-neutral-700" title={it.detail}>{it.detail}</td>
              <td className="py-2 pr-4 text-center">
                {it.viewed ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold uppercase tracking-wide">{t("status.viewed")}</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold uppercase tracking-wide">{t("status.new")}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
