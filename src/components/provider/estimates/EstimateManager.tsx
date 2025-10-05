"use client";

import { RefreshButton } from "@/components/common/RefreshButton";
import { useEstimatesService } from "@/services/useEstimatesService";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";
import { BulkActions } from "./BulkActions";
import { EstimateDetailModal } from "./EstimateDetailModal";
import { FilterBar } from "./FilterBar";
import { ItemsTable } from "./ItemsTable";
import type { EstimateDto, EstimateSort, ViewedFilter } from "./types";

interface Props { 
  initial: EstimateDto[] 
}

export const EstimateManager: React.FC<Props> = ({ initial }) => {
  const [raw, setRaw] = useState<EstimateDto[]>(initial);
  const [search, setSearch] = useState("");
  const [viewed, setViewed] = useState<ViewedFilter>("ALL");
  const [sort, setSort] = useState<EstimateSort>("created_desc");
  const [active, setActive] = useState<EstimateDto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fetchAbort = useRef<AbortController | null>(null);
  const { list, markViewed, bulk, state } = useEstimatesService();
  
  const t = useTranslations("ProviderEstimates");

  const derived = useMemo(() => {
    let out = raw;
    const term = search.trim().toLowerCase();
    if (term) {
      out = out.filter(e =>
        e.name.toLowerCase().includes(term) ||
        e.phone.toLowerCase().includes(term) ||
        (e.email || "").toLowerCase().includes(term) ||
        (e.category?.name || "").toLowerCase().includes(term) ||
        e.detail.toLowerCase().includes(term)
      );
    }
    if (viewed !== "ALL") out = out.filter(e => viewed === "viewed" ? e.viewed : !e.viewed);
    switch (sort) {
      case "name_asc": out = [...out].sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name_desc": out = [...out].sort((a, b) => b.name.localeCompare(a.name)); break;
      case "created_asc": out = [...out].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      default: out = [...out].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return out;
  }, [raw, search, viewed, sort]);

  const runFetch = useCallback(async () => {
    if (fetchAbort.current) fetchAbort.current.abort();
    const controller = new AbortController();
    fetchAbort.current = controller;
    try {
      const j = await list(controller.signal);
      if (!controller.signal.aborted) setRaw(j.items);
    } catch { /* ignore */ }
  }, [list]);

  async function markViewedOptimistic(id: string) {
    // optimistic
    setRaw(prev => prev.map(e => e.id === id ? { ...e, viewed: true } : e));
    try { await markViewed(id); }
    catch { // rollback if failed
      setRaw(prev => prev.map(e => e.id === id ? { ...e, viewed: false } : e));
    }
  }

  const toggleOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds(prev => {
      const ids = derived.map(d => d.id);
      const allSelected = ids.every(id => prev.has(id));
      if (allSelected) return new Set();
      return new Set(ids);
    });
  }, [derived]);

  const performBulk = useCallback(async (op: 'markViewed' | 'archive' | 'unarchive' | 'delete') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    // optimistic modifications
    setRaw(prev => prev.map(e => {
      if (!selectedIds.has(e.id)) return e;
      if (op === 'markViewed') return { ...e, viewed: true };
      if (op === 'archive') return { ...e, archived: true }; // archived property may exist on model
      if (op === 'unarchive') return { ...e, archived: false };
      if (op === 'delete') return e; // remove later
      return e;
    }).filter(e => op === 'delete' ? !selectedIds.has(e.id) : true));
    try {
      await bulk(op, ids);
    } catch {
      // refetch on failure to restore authoritative state
      void runFetch();
    } finally {
      setSelectedIds(new Set());
    }
  }, [bulk, selectedIds, runFetch]);

  return (
    <div className="max-w-5xl mx-auto md:px-6 pb-10 space-y-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#8a6a40] via-[#a4814f] to-[#8a6a40]">{t("title")}</h1>
            <p className="text-sm text-neutral-500 mt-1">{t("subtitle")}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <RefreshButton onRefresh={runFetch} label={t("ui.refresh") || "Refresh"} refreshingLabel={t("ui.refreshing") || "Refreshing..."} />
          </div>
        </div>
        <FilterBar
          search={search}
          onSearchChange={v => setSearch(v)}
          viewed={viewed}
          onViewedChange={v => setViewed(v)}
          sort={sort}
          onSortChange={v => setSort(v)}
        />
      </div>
      <ItemsTable
        items={derived}
        onRowClick={(it) => { setActive(it); setModalOpen(true); }}
        selectedIds={selectedIds}
        onToggle={toggleOne}
        onToggleAll={toggleAll}
      />
      <BulkActions
        count={selectedIds.size}
        disabled={state.loading}
        onAction={performBulk}
      />
      <EstimateDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        estimate={active}
        onMarkViewed={(id) => { void markViewedOptimistic(id); setModalOpen(false); }}
      />
    </div>
  );
};
