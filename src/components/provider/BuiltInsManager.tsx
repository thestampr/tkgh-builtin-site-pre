"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { FilterBar } from "./builtins/FilterBar";
import { ItemsTable } from "./builtins/ItemsTable";
import { ModalShell } from "./builtins/ModalShell";
import { LocaleTabs } from "./builtins/LocaleTabs";
import { BaseLocaleForm } from "./builtins/BaseLocaleForm";
import { TranslationForm } from "./builtins/TranslationForm";
import { useBuiltInsService } from "@/lib/useBuiltInsService";
import type { BuiltIn, Category } from "@/types/builtins";

interface BuiltInsManagerProps { initialItems: BuiltIn[]; categories: Category[]; locale: string; }

export default function BuiltInsManager({ initialItems, categories, locale }: BuiltInsManagerProps) {
    const t = useTranslations("ProviderBuiltIns");
    const [items, setItems] = useState<BuiltIn[]>(initialItems);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<BuiltIn | null>(null);
    interface DraftShape { title: string; slug: string; price: number | null; currency: string | null; categoryId: string | null; content: string | null; gallery: string[]; }
    const emptyDraft: DraftShape = { title: "", slug: "", price: null, currency: null, categoryId: null, content: null, gallery: [] };
    const [draft, setDraft] = useState<DraftShape>(emptyDraft);
    const [translationDraft, setTranslationDraft] = useState<{ title?: string; content?: string; price?: number | null; currency?: string | null; published?: boolean }>({});
    const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "th";
    const [activeLocale, setActiveLocale] = useState<string>(defaultLocale);
    const [message, setMessage] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement | null>(null); // retained
    const [publishingId, setPublishingId] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [sort, setSort] = useState("updated_desc");
    const fetchTimer = useRef<any>(null);

    function slugify(str: string) { return str.toLowerCase().trim().replace(/[^a-z0-9ก-๙\s-]/g, "").replace(/\s+/g, "-").substring(0, 80); }
    const { list, detail, create, update: updateItem, upsertTranslation, publishToggle, remove: removeItem, uploadImages: uploadImagesService, state: serviceState } = useBuiltInsService();

    function openNew() {
        const firstCat = categories[0]?.id || "";
        setEditing(null);
        setDraft({ ...emptyDraft, categoryId: firstCat });
        setTranslationDraft({});
        setActiveLocale(defaultLocale);
        setModalOpen(true);
    }
    async function openEdit(item: BuiltIn) {
        setEditing(item);
        const gallery = item.galleryJson ? JSON.parse(item.galleryJson) : (item.gallery || []);
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
    function update(patch: any) { setDraft((d: any) => ({ ...d, ...patch })); }

    async function uploadImages(files: FileList | null) {
        if (!files || !files.length) return;
        try {
            const urls = await uploadImagesService(files);
            update({ gallery: [...draft.gallery, ...urls].slice(0, 12) });
        } catch { setMessage("Upload failed"); }
    }

    async function save() {
        // Always save base + optional translation in one action
        if (!draft.title) { setMessage("Title required"); return; }
        if (!draft.categoryId) { setMessage("Category required"); return; }
        const hasTranslationInput = Object.values(translationDraft || {}).some(v => v !== null && v !== "" && v !== false);
        if (hasTranslationInput && !translationDraft.title) { setMessage("Translation title required"); return; }
        startTransition(async () => {
            setMessage(null);
            const derivedCover = draft.gallery[0] || null;
            let currentItem: BuiltIn | null = null;
            try {
                if (!editing) {
                    const created = await create({ title: draft.title, slug: draft.slug || slugify(draft.title), price: draft.price ? Number(draft.price) : null, currency: draft.currency || null, categoryId: draft.categoryId || null, content: draft.content || null, gallery: draft.gallery, });
                    currentItem = created.item;
                    if (hasTranslationInput) {
                        const trans = await upsertTranslation(currentItem.id, "en", { title: translationDraft.title || null, content: translationDraft.content || null, price: translationDraft.price ?? null, currency: translationDraft.currency || null, published: !!translationDraft.published });
                        currentItem = trans.item;
                    }
                    setItems([currentItem, ...items]);
                } else {
                    const updated = await updateItem(editing.id, { direct: true, title: draft.title, content: draft.content || null, price: draft.price ? Number(draft.price) : null, currency: draft.currency || null, categoryId: draft.categoryId || null, coverImage: derivedCover, gallery: draft.gallery });
                    currentItem = updated.item;
                    if (hasTranslationInput) {
                        const trans = await upsertTranslation(editing.id, "en", { title: translationDraft.title || null, content: translationDraft.content || null, price: translationDraft.price ?? null, currency: translationDraft.currency || null, published: !!translationDraft.published });
                        currentItem = trans.item;
                    }
                    setItems(items.map(it => it.id === currentItem!.id ? currentItem! : it));
                }
                setModalOpen(false);
            } catch {
                setMessage("Save failed");
            }
        });
    }

    async function remove(item: BuiltIn) { if (!confirm("Delete item?")) return; startTransition(async () => { try { await removeItem(item.id); setItems(items.filter(i => i.id !== item.id)); } catch { /* ignore */ } }); }

    async function togglePublish(it: BuiltIn) {
        if (publishingId) return;
        setPublishingId(it.id);
        const action = it.status === "PUBLISHED" ? "unpublish" : "publish";
        try {
            const j = await publishToggle(it.id, action);
            setItems(items.map(x => x.id === it.id ? { ...x, status: j.item.status, favoritesCount: j.item.favoritesCount ?? x.favoritesCount } : x));
        } catch {/* ignore */ } finally { setPublishingId(null); }
    }

    function scheduleFetch() {
        if (fetchTimer.current) clearTimeout(fetchTimer.current);
        fetchTimer.current = setTimeout(runFetch, 400);
    }
    async function runFetch() {
        try {
            const j = await list({ search: query.trim() || undefined, status: statusFilter !== "ALL" ? statusFilter : undefined, categoryId: categoryFilter || undefined, sort: sort || undefined });
            setItems(j.items);
        } catch { /* ignore */ }
    }

    // Auto refresh favorites / views count every 20s and on tab focus
    useEffect(() => {
        function onVisibility() { if (document.visibilityState === "visible") runFetch(); }
        document.addEventListener("visibilitychange", onVisibility);
        return () => { 
            document.removeEventListener("visibilitychange", onVisibility); 
        };
    }, [query, statusFilter, categoryFilter, sort]);

    return (
        <div className="max-w-5xl mx-auto px-6 pb-10 space-y-10">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#8a6a40] via-[#a4814f] to-[#8a6a40]">{t("title")}</h1>
                        <p className="text-sm text-neutral-500 mt-1">{t("subtitle")}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <button onClick={openNew} className="px-4 py-2 rounded bg-neutral-900 text-white hover:bg-neutral-800 transition">{t("new")}</button>
                        {message && <span className="text-xs text-neutral-500">{message}</span>}
                    </div>
                </div>
                <FilterBar
                    query={query}
                    onQueryChange={v => { setQuery(v); scheduleFetch(); }}
                    statusFilter={statusFilter}
                    onStatusChange={v => { setStatusFilter(v); scheduleFetch(); }}
                    categoryFilter={categoryFilter}
                    onCategoryChange={v => { setCategoryFilter(v); scheduleFetch(); }}
                    sort={sort}
                    onSortChange={v => { setSort(v); scheduleFetch(); }}
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
                            <button onClick={() => setModalOpen(false)} className="text-sm px-4 py-2 rounded border border-neutral-300 hover:bg-white">{t("cancel") || "Cancel"}</button>
                            <button disabled={pending} onClick={save} className="text-sm px-5 py-2 rounded bg-neutral-900 text-white disabled:opacity-50">{pending ? (t("saving") || "Saving...") : (t("save") || "Save")}</button>
                        </div>
                    </>
                )}
            >
                <LocaleTabs locales={[defaultLocale, "en"]} active={activeLocale} onChange={setActiveLocale} />
                {activeLocale === defaultLocale ? (
                    <BaseLocaleForm
                        draft={draft}
                        onChange={patch => update(patch)}
                        categories={categories}
                        editing={editing}
                        t={t}
                        uploadImages={uploadImages}
                        slugify={slugify}
                    />
                ) : (
                    <TranslationForm
                        draft={translationDraft}
                        onChange={d => setTranslationDraft(d)}
                        t={t}
                        localeLabel="EN"
                    />
                )}
            </ModalShell>
        </div>
    );
}
