"use client";

import { LocaleTabs } from "@/components/LocaleTabs";
import { ModalShell } from "@/components/common/ModalShell";
import { RefreshButton } from "@/components/common/RefreshButton";
import { defaultLocale, locales } from "@/i18n/navigation";
import { confirmModal } from "@/lib/confirm";
import { useCategoriesService } from "@/lib/useCategoriesService";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { BaseLocaleForm } from "./BaseLocaleForm";
import { FilterBar } from "./FilterBar";
import { ItemsTable } from "./ItemsTable";
import { TranslationForm } from "./TranslationForm";
import type { CategoryDto, DraftShape, SortKind, TranslationDraft } from "./types";

interface CategoriesManagerProps {
  initialCategories: CategoryDto[];
}

const emptyDraft: DraftShape = {
  name: "",
  slug: "",
  published: true,
  coverImage: null,
  excerpt: null,
  description: null
};

export default function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
  const [rawCategories, setRawCategories] = useState<CategoryDto[]>(initialCategories);
  const [categories, setCategories] = useState<CategoryDto[]>(initialCategories);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [draft, setDraft] = useState<DraftShape>(emptyDraft);
  const [translationDraft, setTranslationDraft] = useState<TranslationDraft>({});
  const [activeLocale, setActiveLocale] = useState<string>(defaultLocale);
  const [search, setSearch] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<"ALL" | "true" | "false">("ALL");
  const [sort, setSort] = useState<SortKind>("updated_desc");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const fetchAbort = useRef<AbortController | null>(null);

  const { list, create, update: updateService, upsertTranslation, publishToggle, remove: removeService, uploadCover } = useCategoriesService();

  const t = useTranslations("ProviderCategories");

  function applyLocal(
    source: CategoryDto[],
    params: { search: string; published: "ALL" | "true" | "false"; sort: SortKind }
  ): CategoryDto[] {
    const term = params.search.trim().toLowerCase();
    let out = source;
    if (params.published !== "ALL") {
      const flag = params.published === "true";
      out = out.filter(c => !!c.published === flag);
    }
    if (term) {
      out = out.filter(c =>
        (c.name || "").toLowerCase().includes(term) ||
        (c.slug || "").toLowerCase().includes(term) ||
        (c.excerpt || "").toLowerCase().includes(term)
      );
    }
    switch (params.sort) {
      case "name_asc":
        out = [...out].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "name_desc":
        out = [...out].sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        break;
      case "created_desc":
        out = [...out].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "created_asc":
        out = [...out].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      default:
        out = [...out].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return out;
  }

  function openNew() {
    setEditing(null);
    setDraft(emptyDraft);
    setTranslationDraft({});
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverFile(null);
    setCoverPreviewUrl(null);
    setActiveLocale(defaultLocale);
    setModalOpen(true);
  }

  async function openEdit(cat: CategoryDto) {
    setEditing(cat);
    setDraft({
      name: cat.name,
      slug: cat.slug,
      published: !!cat.published,
      coverImage: cat.coverImage || null,
      excerpt: cat.excerpt || null,
      description: cat.description || null,
    });
    setTranslationDraft({});
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverFile(null);
    setCoverPreviewUrl(null);
    setActiveLocale(defaultLocale);
    setModalOpen(true);
  }

  useEffect(() => {
    if (!editing) return;
    if (activeLocale === defaultLocale) return;

    // load translation draft
    const tr = editing.translations?.find(t => t.locale === activeLocale);
    setTranslationDraft(tr ? {
      name: tr.name || "",
      excerpt: tr.excerpt || "",
      description: tr.description || "",
      published: !!tr.published
    } : {});
   }, [activeLocale]);

  function onSelectCoverFile(file: File | null) {
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverFile(file);
    setCoverPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  function onRemoveCoverImage() {
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverFile(null);
    setCoverPreviewUrl(null);
    update({ coverImage: null });
  }

  async function save() {
    setMessage(null);
    if (!draft.name || !draft.slug) { setMessage(t("messages.nameSlugRequired")); return; }
    const hasTranslationInput = Object.values(translationDraft || {}).some(v => v !== null && v !== "" && v !== false);
    if (hasTranslationInput && !translationDraft.name) { setMessage(t("messages.translationNameRequired")); return; }
    startTransition(async () => {
      try {
        let coverUrl: string | null = draft.coverImage || null;
        if (coverFile) coverUrl = await uploadCover(coverFile);
        let current: CategoryDto;
        if (!editing) {
          const created = await create({ name: draft.name, slug: draft.slug, published: draft.published, coverImage: coverUrl, excerpt: draft.excerpt || null, description: draft.description || null });
          current = created.category as CategoryDto;
          if (hasTranslationInput) {
            const trans = await upsertTranslation(current.id, "en", { name: translationDraft.name || "", description: translationDraft.description || "", excerpt: translationDraft.excerpt || "", published: !!translationDraft.published });
            current = trans.category as CategoryDto;
          }
          await runFetch();
        } else {
          // update base
          const upd = await updateService(editing.id, { name: draft.name, published: draft.published, coverImage: coverUrl, excerpt: draft.excerpt || null, description: draft.description || null });
          current = upd.category as CategoryDto;
          if (hasTranslationInput) {
            const trans = await upsertTranslation(editing.id, "en", { name: translationDraft.name || "", description: translationDraft.description || "", excerpt: translationDraft.excerpt || "", published: !!translationDraft.published });
            current = trans.category as CategoryDto;
          }
          await runFetch();
        }
        setModalOpen(false);
        if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
        setCoverFile(null);
        setCoverPreviewUrl(null);
      } catch {
        setMessage("Save failed");
      }
    });
  }

  function update(patch: Partial<DraftShape>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  async function remove(cat: CategoryDto) {
    const confirm = await confirmModal(t("confirm.delete.message"), {
      title: t("confirm.delete.title") || "Delete Category",
      confirmText: t("confirm.delete.confirmText") || "Delete",
      cancelText: t("confirm.delete.cancelText") || "Cancel",
      danger: true
    });
    if (!confirm) return;

    startTransition(async () => {
      try {
        await removeService(cat.id);
        await runFetch();
      } catch { /* ignore */ }
    });
  }
  
  async function togglePublish(cat: CategoryDto) {
    const nextPublished = !cat.published;
    try {
      await publishToggle(cat.id, nextPublished);
      await runFetch();
    } catch {/* ignore */ }
  }

  async function runFetch() {
    if (fetchAbort.current) fetchAbort.current.abort();
    const controller = new AbortController();
    fetchAbort.current = controller;
    try {
      const j = await list({
        signal: controller.signal,
      });
      if (!controller.signal.aborted) {
        setRawCategories(j.categories);
        setCategories(applyLocal(j.categories, { search, published: publishedFilter, sort }));
      }
    } catch (e) {
      // ignore abort errors
    }
  }

  // Auto refresh on tab focus/visibility
  useEffect(() => {
    function onVisibility() { if (document.visibilityState === "visible") void runFetch(); }
    document.addEventListener("visibilitychange", onVisibility);
    return () => { document.removeEventListener("visibilitychange", onVisibility); };
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
          search={search}
          onSearchChange={(v) => { setSearch(v); setCategories(applyLocal(rawCategories, { search: v, published: publishedFilter, sort })); }}
          published={publishedFilter}
          onPublishedChange={(v) => { setPublishedFilter(v); setCategories(applyLocal(rawCategories, { search, published: v, sort })); }}
          sort={sort}
          onSortChange={(v) => { setSort(v); setCategories(applyLocal(rawCategories, { search, published: publishedFilter, sort: v })); }}
        />
      </div>

      <ItemsTable 
        items={categories} 
        onEdit={openEdit} 
        onDelete={remove} 
        onTogglePublish={togglePublish}
      />

      <ModalShell
        open={modalOpen}
        title={editing ? t("editTitle") : t("new")}
        onClose={() => {
          if (!pending) {
            setModalOpen(false);
            if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
            setCoverFile(null);
            setCoverPreviewUrl(null);
          }
        }}
        footer={(
          <>
            <div className="text-xs text-neutral-500">{message}</div>
            <div className="flex items-center gap-3">
              <button onClick={() => setModalOpen(false)} className="btn btn-ghost">{t("ui.cancel")}</button>
              <button onClick={save} disabled={pending} className="btn btn-secondary">{pending ? t("ui.saving") : t("ui.save")}</button>
            </div>
          </>
        )}
        className="max-w-xl"
      >
        <LocaleTabs className="justify-end" locales={locales} active={activeLocale} onChange={setActiveLocale} />

        { activeLocale === defaultLocale
          ? (
            <BaseLocaleForm
              draft={draft}
              onChange={(patch) => update(patch)}
              coverPreviewUrl={coverPreviewUrl}
              onSelectCoverFile={onSelectCoverFile}
              onRemoveCoverImage={onRemoveCoverImage}
            />
          ) : (
            <TranslationForm
              value={translationDraft}
              onChange={d => setTranslationDraft({...translationDraft, ...d})}
              localeLabel={activeLocale.toUpperCase()}
            />
          )
        }
      </ModalShell>
    </div>
  );
}
