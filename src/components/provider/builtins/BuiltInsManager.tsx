"use client";

import { LocaleTabs } from "@/components/LocaleTabs";
import { ModalShell } from "@/components/ModalShell";
import { RefreshButton } from "@/components/common/RefreshButton";
import { defaultLocale, locales } from "@/i18n/navigation";
import { confirmModal } from "@/lib/confirm";
import { kebabcase } from "@/lib/formatting";
import { useBuiltInsService } from "@/lib/useBuiltInsService";
import type { BuiltIn, BuiltInStatus, Category } from "@prisma/client";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { BaseLocaleForm } from "./BaseLocaleForm";
import { FilterBar } from "./FilterBar";
import { ItemsTable } from "./ItemsTable";
import { TranslationForm } from "./TranslationForm";
import type {
  BuiltInDto,
  DraftShape,
  InitialItem,
  TranslationDraft,
  sortKind
} from "./types";

interface BuiltInsManagerProps {
  initialItems: InitialItem[];
  categories: Category[];
}

const emptyDraft: DraftShape = {
  title: "",
  slug: "",
  price: null,
  currency: null,
  categoryId: null,
  content: null,
  gallery: []
};

export default function BuiltInsManager({ initialItems, categories }: BuiltInsManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BuiltInDto | null>(null);
  const [draft, setDraft] = useState<DraftShape>(emptyDraft);
  const [translationDraft, setTranslationDraft] = useState<TranslationDraft>({});
  const [activeLocale, setActiveLocale] = useState<string>(defaultLocale);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | BuiltInStatus>("ALL");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sort, setSort] = useState<sortKind>("updated_desc");
  const fetchAbort = useRef<AbortController | null>(null);

  const { list, detail, create, update: updateItem, upsertTranslation, publishToggle, remove: removeItem, uploadImages: uploadImagesService } = useBuiltInsService();

  const t = useTranslations("ProviderBuiltIns");

  const parseGallery = (val: unknown): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter((x): x is string => typeof x === "string");
    if (typeof val === "string") {
      try { const arr = JSON.parse(val); return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : []; } catch { return []; }
    }
    return [];
  };
  const [rawItems, setRawItems] = useState<BuiltInDto[]>(() => initialItems.map(i => ({
    ...(i as BuiltIn),
    languages: i.languages ?? defaultLocale,
    favoritesCount: typeof i.favoritesCount === "number" ? i.favoritesCount : 0,
    gallery: parseGallery(i.galleryJson),
    galleryJson: null,
  })));
  const [items, setItems] = useState<BuiltInDto[]>(() => initialItems.map(i => ({
    ...(i as BuiltIn),
    languages: i.languages ?? defaultLocale,
    favoritesCount: typeof i.favoritesCount === "number" ? i.favoritesCount : 0,
    gallery: parseGallery(i.galleryJson),
    galleryJson: null,
  })));
  const normalizeService = (i: BuiltIn & { languages?: string | null; favoritesCount?: number | null; gallery?: string[] | null }): BuiltInDto => ({
    ...(i as BuiltIn),
    languages: i.languages ?? defaultLocale,
    favoritesCount: typeof i.favoritesCount === "number" ? i.favoritesCount : 0,
    gallery: Array.isArray(i.gallery) ? i.gallery : [],
    galleryJson: null,
  });

  function applyLocal(
    source: BuiltInDto[],
    params: { query: string; status: "ALL" | BuiltInStatus; categoryId: string; sort: sortKind }
  ): BuiltInDto[] {
    const term = params.query.trim().toLowerCase();
    let out = source;
    if (params.status !== "ALL") out = out.filter(i => i.status === params.status);
    if (params.categoryId) out = out.filter(i => i.categoryId === params.categoryId);
    if (term) out = out.filter(i => (i.title || "").toLowerCase().includes(term) || (i.summary || "").toLowerCase().includes(term));
    switch (params.sort) {
      case "title_asc": out = [...out].sort((a, b) => (a.title || "").localeCompare(b.title || "")); break;
      case "title_desc": out = [...out].sort((a, b) => (b.title || "").localeCompare(a.title || "")); break;
      case "views_desc": out = [...out].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)); break;
      case "favorites_desc": out = [...out].sort((a, b) => (b.favoritesCount || 0) - (a.favoritesCount || 0)); break;
      default: out = [...out].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return out;
  }

  function openNew() {
    const firstCat = categories[0]?.id || "";
    setEditing(null);
    setDraft({ ...emptyDraft, categoryId: firstCat });
    setTranslationDraft({});
    setActiveLocale(defaultLocale);
    setModalOpen(true);
  }

  async function openEdit(item: BuiltInDto) {
    setEditing(item);
    const gallery = (item.gallery && Array.isArray(item.gallery)) ? item.gallery : (item.galleryJson ? JSON.parse(item.galleryJson as string) : []);
    setDraft({
      title: item.title || "",
      slug: item.slug || "",
      price: item.price ?? null,
      currency: item.currency || null,
      categoryId: item.categoryId || null,
      content: item.content || null,
      gallery
    });
    setTranslationDraft({});
    setActiveLocale(defaultLocale);
    setModalOpen(true);
    try {
      const d = await detail(item.id);
      const en = d.item?.translations?.find(tr => tr.locale === "en");
      if (en) setTranslationDraft({ title: en.title || "", content: en.content || "", price: en.price ?? null, currency: en.currency || "", published: !!en.published });
    } catch {/* ignore */ }
  }
  function update(patch: Partial<DraftShape>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  async function uploadImages(files: FileList | null) {
    if (!files || !files.length) return;
    try {
      const urls = await uploadImagesService(files);
      update({ gallery: [...draft.gallery, ...urls].slice(0, 12) });
    } catch { setMessage("Upload failed"); }
  }

  async function save() {
    if (!draft.title) { setMessage("Title required"); return; }
    if (!draft.categoryId) { setMessage("Category required"); return; }
    const hasTranslationInput = Object.values(translationDraft || {}).some(v => v !== null && v !== "" && v !== false);
    if (hasTranslationInput && !translationDraft.title) { setMessage("Translation title required"); return; }
    startTransition(async () => {
      setMessage(null);
      const derivedCover = draft.gallery[0] || null;
      let currentItem: BuiltInDto | null = null;
      try {
        if (!editing) {
          const created = await create({
            title: draft.title,
            slug: draft.slug || kebabcase(draft.title),
            price: draft.price ? Number(draft.price) : null,
            currency: draft.currency || null,
            categoryId: draft.categoryId || null,
            content: draft.content || null,
            gallery: draft.gallery,
          });
          currentItem = normalizeService(created.item);
          if (hasTranslationInput) {
            const trans = await upsertTranslation(currentItem.id, "en", {
              title: translationDraft.title || null,
              content: translationDraft.content || null,
              price: translationDraft.price ?? null,
              currency: translationDraft.currency || null,
              published: !!translationDraft.published
            });
            currentItem = normalizeService(trans.item);
          }
          await runFetch();
        } else {
          const updated = await updateItem(editing.id, {
            direct: true,
            title: draft.title,
            content: draft.content || null,
            price: draft.price ? Number(draft.price) : null,
            currency: draft.currency || null,
            categoryId: draft.categoryId || null,
            coverImage: derivedCover,
            gallery: draft.gallery
          });
          currentItem = normalizeService(updated.item);
          if (hasTranslationInput) {
            const trans = await upsertTranslation(editing.id, "en", {
              title: translationDraft.title || null,
              content: translationDraft.content || null,
              price: translationDraft.price ?? null,
              currency: translationDraft.currency || null,
              published: !!translationDraft.published
            });
            currentItem = normalizeService(trans.item);
          }
          await runFetch();
        }
        setModalOpen(false);
      } catch {
        setMessage("Save failed");
      }
    });
  }

  async function remove(item: BuiltInDto) {
    const confirm = await confirmModal(t("confirm.delete.message"), {
      title: t("confirm.delete.title") || "Delete Built-in",
      confirmText: t("confirm.delete.confirmText") || "Delete",
      cancelText: t("confirm.delete.cancelText") || "Cancel",
      danger: true
    });
    if (!confirm) return;

    startTransition(async () => {
      try {
        await removeItem(item.id);
        await runFetch();
      } catch { /* ignore */ }
    });
  }

  async function togglePublish(it: BuiltInDto) {
    if (publishingId) return;
    setPublishingId(it.id);
    const action = it.status === "PUBLISHED" ? "unpublish" : "publish";
    try {
      await publishToggle(it.id, action);
      await runFetch();
    } catch {/* ignore */ }
    finally { setPublishingId(null); }
  }

  const runFetch = useCallback(async () => {
    try {
      if (fetchAbort.current) fetchAbort.current.abort();
      const controller = new AbortController();
      fetchAbort.current = controller;
      const j = await list({
        signal: controller.signal,
      });
      if (!controller.signal.aborted) {
        const normalized = j.items.map(normalizeService);
        setRawItems(normalized);
        setItems(applyLocal(normalized, { query, status: statusFilter, categoryId: categoryFilter, sort }));
      }
    } catch {
      /* ignore */
    }
  }, [list, query, statusFilter, categoryFilter, sort]);

  // Auto refresh on tab focus/visibility
  useEffect(() => {
    function onVisibility() { if (document.visibilityState === "visible") runFetch(); }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [runFetch]);

  return (
    <div className="max-w-5xl mx-auto md:px-6 pb-10 space-y-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#8a6a40] via-[#a4814f] to-[#8a6a40]">{t("title")}</h1>
            <p className="text-sm text-neutral-500 mt-1">{t("subtitle")}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <RefreshButton onRefresh={() => runFetch()} label={t("ui.refresh") || "Refresh"} refreshingLabel={t("ui.refreshing") || "Refreshing..."} />
            <button onClick={openNew} className="btn btn-secondary">
              <Plus size={14} />
              {t("new")}
            </button>
            {message && <span className="text-xs text-neutral-500">{message}</span>}
          </div>
        </div>
        <FilterBar
          query={query}
          onQueryChange={v => { setQuery(v); setItems(applyLocal(rawItems, { query: v, status: statusFilter, categoryId: categoryFilter, sort })); }}
          statusFilter={statusFilter}
          onStatusChange={v => { const nv = v as BuiltInStatus | "ALL"; setStatusFilter(nv); setItems(applyLocal(rawItems, { query, status: nv, categoryId: categoryFilter, sort })); }}
          categoryFilter={categoryFilter}
          onCategoryChange={v => { setCategoryFilter(v); setItems(applyLocal(rawItems, { query, status: statusFilter, categoryId: v, sort })); }}
          sort={sort}
          onSortChange={v => { const ns = v as typeof sort; setSort(ns); setItems(applyLocal(rawItems, { query, status: statusFilter, categoryId: categoryFilter, sort: ns })); }}
          categories={categories}
        />
      </div>

      <ItemsTable
        items={items}
        defaultLocale={defaultLocale}
        onEdit={openEdit}
        onDelete={remove}
        onTogglePublish={togglePublish}
        publishingId={publishingId}
      />

      <ModalShell
        open={modalOpen}
        title={editing ? (t("editTitle") || "Edit Built-in") : (t("new"))}
        onClose={() => !pending && setModalOpen(false)}
        footer={(
          <>
            <div className="text-xs text-neutral-500">{message}</div>
            <div className="flex items-center gap-3">
              <button onClick={() => setModalOpen(false)} className="btn btn-ghost">{t("cancel") || "Cancel"}</button>
              <button disabled={pending} onClick={save} className="btn btn-secondary">{pending ? (t("saving") || "Saving...") : (t("save") || "Save")}</button>
            </div>
          </>
        )}
      >
        <LocaleTabs className="justify-end" locales={locales} active={activeLocale} onChange={setActiveLocale} />

        {activeLocale === defaultLocale ? (
          <BaseLocaleForm
            draft={draft}
            onChange={patch => update(patch)}
            categories={categories}
            editing={editing}
            uploadImages={uploadImages}
            slugify={kebabcase}
          />
        ) : (
          <TranslationForm
            value={translationDraft}
            onChange={d => setTranslationDraft(d)}
            localeLabel="EN"
          />
        )}
      </ModalShell>
    </div>
  );
}
