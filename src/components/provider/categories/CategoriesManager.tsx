"use client";

import { LocaleTabs } from "@/components/LocaleTabs";
import { ModalShell } from "@/components/ModalShell";
import { locales } from "@/i18n/navigation";
import { kebabcase } from "@/lib/formatting";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { BaseLocaleForm } from "./BaseLocaleForm";
import { FilterBar } from "./FilterBar";
import { ItemsTable } from "./ItemsTable";
import { TranslationForm } from "./TranslationForm";
import type { CategoryDto, DraftShape, SortKind, TranslationDraft } from "./types";
import { confirmModal } from "@/src/lib/confirm";

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
  const t = useTranslations("ProviderCategories");
  const [categories, setCategories] = useState<CategoryDto[]>(initialCategories);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [draft, setDraft] = useState<DraftShape>(emptyDraft);
  const [translationDraft, setTranslationDraft] = useState<TranslationDraft>({});
  const [activeLocale, setActiveLocale] = useState<string>(process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "th");
  const [search, setSearch] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<"ALL" | "true" | "false">("ALL");
  const [sort, setSort] = useState<SortKind>("updated_desc");
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  function openNew() {
    setEditing(null);
    setDraft({ ...emptyDraft, published: true });
    setTranslationDraft({});
    setActiveLocale(process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "th");
    setModalOpen(true); 
    setDraft(emptyDraft);
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverFile(null);
    setCoverPreviewUrl(null);
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
    setActiveLocale(process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "th");
    setModalOpen(true);
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverFile(null);
    setCoverPreviewUrl(null);
    // Load translations
    try {
      const res = await fetch(`/api/provider/categories/${cat.id}`);
      if (res.ok) {
        const json = await res.json();
        const en = (json.category?.translations || []).find((t: { locale: string }) => t.locale === "en");
        if (en) setTranslationDraft({ name: en.name || "", excerpt: en.excerpt || "", description: en.description || "", published: !!en.published });
      }
    } catch {/* ignore */ }
  }

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

  async function saveCategory() {
    setMessage(null);
    const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "th";
    if (!draft.name || !draft.slug) { setMessage(t("messages.nameSlugRequired")); return; }
    const hasTranslationInput = Object.values(translationDraft || {}).some(v => v !== null && v !== "" && v !== false);
    if (hasTranslationInput && !translationDraft.name) { setMessage(t("messages.translationNameRequired")); return; }
    startTransition(async () => {
      try {
        let coverUrl: string | null = draft.coverImage || null;
        if (coverFile) {
          const fd = new FormData();
          fd.append("file", coverFile);
          const up = await fetch("/api/provider/categories/upload", { method: "POST", body: fd });
          if (!up.ok) { setMessage(t("messages.uploadFailed") || "Upload failed"); return; }
          const upj = await up.json();
          coverUrl = upj.url as string;
        }
        let current: CategoryDto;
        if (!editing) {
          // create base first
          const res = await fetch("/api/provider/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: draft.name, slug: draft.slug, published: draft.published, coverImage: coverUrl, excerpt: draft.excerpt || null, description: draft.description || null }) });
          if (!res.ok) { try { const e = await res.json(); setMessage(e.error || t("messages.createFailed")); } catch { setMessage(t("messages.createFailed")); } return; }
          const json = await res.json(); current = json.category as CategoryDto;
          if (hasTranslationInput) {
            const transRes = await fetch(`/api/provider/categories/${current.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ translationLocale: "en", translation: { name: translationDraft.name || null, description: translationDraft.description || null, excerpt: translationDraft.excerpt || null, published: !!translationDraft.published } }) });
            if (!transRes.ok) { setMessage(t("messages.translationFailed")); return; }
            const transJson = await transRes.json(); current = transJson.category as CategoryDto;
          }
          setCategories([current, ...categories]);
        } else {
          // update base
          const res = await fetch(`/api/provider/categories/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: draft.name, published: draft.published, coverImage: coverUrl, excerpt: draft.excerpt || null, description: draft.description || null }) });
          if (!res.ok) { setMessage(t("messages.updateFailed")); return; }
          const json = await res.json(); current = json.category as CategoryDto;
          if (hasTranslationInput) {
            const transRes = await fetch(`/api/provider/categories/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ translationLocale: "en", translation: { name: translationDraft.name || null, description: translationDraft.description || null, excerpt: translationDraft.excerpt || null, published: !!translationDraft.published } }) });
            if (!transRes.ok) { setMessage(t("messages.translationFailed")); return; }
            const transJson = await transRes.json(); current = transJson.category as CategoryDto;
          }
          setCategories(categories.map(c => c.id === current.id ? current : c));
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
      const res = await fetch(`/api/provider/categories/${cat.id}`, { method: "DELETE" });
      if (res.ok) setCategories(categories.filter(c => c.id !== cat.id));
    });
  }

  const defaultLocale = activeLocale === (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "th");

  function scheduleFetch() {
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    fetchTimer.current = setTimeout(runFetch, 400);
  }

  async function runFetch() {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (publishedFilter !== "ALL") params.set("published", publishedFilter);
    if (sort) params.set("sort", sort);
    const res = await fetch(`/api/provider/categories?${params.toString()}`);
    if (res.ok) { const j = await res.json(); setCategories(j.categories); }
  }

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
          search={search}
          onSearchChange={(v) => { setSearch(v); scheduleFetch(); }}
          published={publishedFilter}
          onPublishedChange={(v) => { setPublishedFilter(v); scheduleFetch(); }}
          sort={sort}
          onSortChange={(v) => { setSort(v as SortKind); scheduleFetch(); }}
          t={(k) => t(k)}
        />
      </div>
      <ItemsTable items={categories} t={(k) => t(k)} onEdit={openEdit} onDelete={remove} />

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
              <button onClick={saveCategory} disabled={pending} className="btn btn-secondary">{pending ? t("ui.saving") : t("ui.save")}</button>
            </div>
          </>
        )}
        className="max-w-xl"
      >
        <LocaleTabs className="justify-end" locales={locales} active={activeLocale} onChange={setActiveLocale} />

        {defaultLocale ? (
          <BaseLocaleForm
            draft={draft}
            onChange={(patch) => update(patch)}
            t={t}
            coverPreviewUrl={coverPreviewUrl}
            onSelectCoverFile={onSelectCoverFile}
            onRemoveCoverImage={onRemoveCoverImage}
          />
        ) : (
          <TranslationForm 
            value={translationDraft} 
            onChange={(p) => setTranslationDraft(d => ({ ...d, ...p }))} 
            t={t} 
          />
        )}

      </ModalShell>
    </div>
  );
}
