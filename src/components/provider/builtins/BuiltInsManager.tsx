"use client";

import { LocaleTabs } from "@/components/LocaleTabs";
import { ModalShell } from "@/components/ModalShell";
import { defaultLocale, locales } from "@/i18n/navigation";
import { kebabcase } from "@/lib/formatting";
import { useBuiltInsService } from "@/lib/useBuiltInsService";
import { confirmModal } from "@/src/lib/confirm";
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
  const t = useTranslations("ProviderBuiltIns");
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
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { list, detail, create, update: updateItem, upsertTranslation, publishToggle, remove: removeItem, uploadImages: uploadImagesService, state: serviceState } = useBuiltInsService();

  const parseGallery = (val: unknown): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter((x): x is string => typeof x === "string");
    if (typeof val === "string") {
      try { const arr = JSON.parse(val); return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : []; } catch { return []; }
    }
    return [];
  };
  const [items, setItems] = useState<BuiltInDto[]>(() => initialItems.map(i => ({
    ...(i as BuiltIn),
    languages: i.languages ?? (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "th"),
    favoritesCount: typeof i.favoritesCount === "number" ? i.favoritesCount : 0,
    gallery: parseGallery(i.galleryJson),
    galleryJson: null,
  })));
  const normalizeService = (i: BuiltIn & { languages?: string | null; favoritesCount?: number | null; gallery?: string[] | null }): BuiltInDto => ({
    ...(i as BuiltIn),
    languages: i.languages ?? (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "th"),
    favoritesCount: typeof i.favoritesCount === "number" ? i.favoritesCount : 0,
    gallery: Array.isArray(i.gallery) ? i.gallery : [],
    galleryJson: null,
  });

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
          setItems([currentItem, ...items]);
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
          setItems(items.map(it => it.id === currentItem!.id ? currentItem! : it));
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
        setItems(items.filter(i => i.id !== item.id)); 
      } catch { /* ignore */ } 
    }); 
  }

  async function togglePublish(it: BuiltInDto) {
    if (publishingId) return;
    setPublishingId(it.id);
    const action = it.status === "PUBLISHED" ? "unpublish" : "publish";
    try {
      const j = await publishToggle(it.id, action);
      setItems(items.map(x => x.id === it.id ? { ...x, status: j.item.status, favoritesCount: (j.item).favoritesCount ?? x.favoritesCount } : x));
    } catch {/* ignore */ }
    finally { setPublishingId(null); }
  }

  const runFetch = useCallback(async () => {
    try {
      const j = await list({
        search: query.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        categoryId: categoryFilter || undefined,
        sort: sort || undefined,
      });
      setItems(j.items.map(normalizeService));
    } catch {
      /* ignore */
    }
  }, [list, query, statusFilter, categoryFilter, sort]);

  function scheduleFetch() {
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    fetchTimer.current = setTimeout(() => { void runFetch(); }, 400);
  }

  // Auto refresh favorites / views count every 20s and on tab focus
  useEffect(() => {
    function onVisibility() { if (document.visibilityState === "visible") runFetch(); }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [runFetch]);

  return (
    <div className="max-w-5xl mx-auto px-6 pb-10 space-y-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#8a6a40] via-[#a4814f] to-[#8a6a40]">{t("title")}</h1>
            <p className="text-sm text-neutral-500 mt-1">{t("subtitle")}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <button onClick={openNew} className="btn btn-secondary">
              <Plus size={14} />
              {t("new")}
            </button>
            {message && <span className="text-xs text-neutral-500">{message}</span>}
          </div>
        </div>
        <FilterBar
          query={query}
          onQueryChange={v => { setQuery(v); scheduleFetch(); }}
          statusFilter={statusFilter}
          onStatusChange={v => { setStatusFilter(v as BuiltInStatus | "ALL"); scheduleFetch(); }}
          categoryFilter={categoryFilter}
          onCategoryChange={v => { setCategoryFilter(v); scheduleFetch(); }}
          sort={sort}
          onSortChange={v => { setSort(v as typeof sort); scheduleFetch(); }}
          categories={categories}
          t={t}
        />
      </div>

      <ItemsTable
        items={items}
        t={t}
        defaultLocale={defaultLocale}
        onEdit={openEdit}
        onDelete={remove}
        onTogglePublish={togglePublish}
        publishingId={publishingId}
        loading={serviceState.loading}
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
            t={t}
            uploadImages={uploadImages}
            slugify={kebabcase}
          />
        ) : (
          <TranslationForm
            value={translationDraft}
            onChange={d => setTranslationDraft(d)}
            t={t}
            localeLabel="EN"
          />
        )}
      </ModalShell>
    </div>
  );
}
