"use client";

import { kebabcase } from "@/src/lib/formatting";
import type {
  Category as _CT,
  CategoryTranslation as _CTT
} from "@prisma/client";
import clsx from "clsx";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

type Category = _CT & { translations?: _CTT[], languages?: string };

interface CategoriesManagerProps {
  initialCategories: Category[];
}

export default function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
  const t = useTranslations("ProviderCategories");
  const [categories, setCategories] = useState(initialCategories);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [draft, setDraft] = useState<any>({}); // base locale draft
  const [translationDraft, setTranslationDraft] = useState<any>({});
  const [activeLocale, setActiveLocale] = useState<string>(process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "th");
  const [search, setSearch] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("ALL");
  const [sort, setSort] = useState("updated_desc");
  const slugManuallyEdited = useRef(false);
  const fetchTimer = useRef<any>(null);

  useEffect(() => {
    if (modalOpen && !editing && !slugManuallyEdited.current) {
      setDraft((d: any) => ({ ...d, slug: kebabcase(d.name || "") }));
    }
  }, [draft.name, modalOpen, editing]);

  function openNew() {
    setEditing(null);
    setDraft({ name: "", slug: "", published: true });
    setTranslationDraft({});
    setActiveLocale(process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "th");
    setModalOpen(true);
    slugManuallyEdited.current = false;
  }

  async function openEdit(cat: any) {
    setEditing(cat);
    setDraft({ ...cat });
    setTranslationDraft({});
    setActiveLocale(process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "th");
    setModalOpen(true);
    slugManuallyEdited.current = true;
    // Load translations
    try {
      const res = await fetch(`/api/provider/categories/${cat.id}`);
      if (res.ok) {
        const json = await res.json();
        const en = json.category?.translations?.find((t: any) => t.locale === "en");
        if (en) setTranslationDraft({ name: en.name || "", excerpt: en.excerpt || "", description: en.description || "", published: !!en.published });
      }
    } catch {/* ignore */ }
  }

  async function saveCategory() {
    setMessage(null);
    const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "th";
    if (!draft.name || !draft.slug) { setMessage(t("messages.nameSlugRequired")); return; }
    const hasTranslationInput = Object.values(translationDraft || {}).some(v => v !== null && v !== "" && v !== false);
    if (hasTranslationInput && !translationDraft.name) { setMessage(t("messages.translationNameRequired")); return; }
    startTransition(async () => {
      try {
        let current: any = null;
        if (!editing) {
          // create base first
          const res = await fetch("/api/provider/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: draft.name, slug: draft.slug, published: draft.published, coverImage: draft.coverImage || null, excerpt: draft.excerpt || null, description: draft.description || null }) });
          if (!res.ok) { try { const e = await res.json(); setMessage(e.error || t("messages.createFailed")); } catch { setMessage(t("messages.createFailed")); } return; }
          const json = await res.json(); current = json.category;
          if (hasTranslationInput) {
            const transRes = await fetch(`/api/provider/categories/${current.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ translationLocale: "en", translation: { name: translationDraft.name || null, description: translationDraft.description || null, excerpt: translationDraft.excerpt || null, published: !!translationDraft.published } }) });
            if (!transRes.ok) { setMessage(t("messages.translationFailed")); return; }
            const transJson = await transRes.json(); current = transJson.category;
          }
          setCategories([current, ...categories]);
        } else {
          // update base
          const res = await fetch(`/api/provider/categories/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: draft.name, published: draft.published, coverImage: draft.coverImage || null, excerpt: draft.excerpt || null, description: draft.description || null }) });
          if (!res.ok) { setMessage(t("messages.updateFailed")); return; }
          const json = await res.json(); current = json.category;
          if (hasTranslationInput) {
            const transRes = await fetch(`/api/provider/categories/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ translationLocale: "en", translation: { name: translationDraft.name || null, description: translationDraft.description || null, excerpt: translationDraft.excerpt || null, published: !!translationDraft.published } }) });
            if (!transRes.ok) { setMessage(t("messages.translationFailed")); return; }
            const transJson = await transRes.json(); current = transJson.category;
          }
          setCategories(categories.map(c => c.id === current.id ? current : c));
        }
        setModalOpen(false);
      } catch {
        setMessage("Save failed");
      }
    });
  }

  function updateDraft(patch: any) { setDraft((d: any) => ({ ...d, ...patch })); }

  function remove(cat: any) {
    if (!confirm("Delete category?")) return; // Could be internationalized if desired with t("ui.confirmDelete")
    startTransition(async () => {
      const res = await fetch(`/api/provider/categories/${cat.id}`, { method: "DELETE" });
      if (res.ok) setCategories(categories.filter(c => c.id !== cat.id));
    });
  }

  const defaultLocale = activeLocale === (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "th");

  function scheduleFetch() { if (fetchTimer.current) clearTimeout(fetchTimer.current); fetchTimer.current = setTimeout(runFetch, 400); }
  async function runFetch() {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (publishedFilter !== "ALL") params.set("published", publishedFilter);
    if (sort) params.set("sort", sort);
    const res = await fetch(`/api/provider/categories?${params.toString()}`);
    if (res.ok) { const j = await res.json(); setCategories(j.categories); }
  }

  const onCoverImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/provider/categories/upload", { method: "POST", body: fd });
    if (res.ok) {
      const j = await res.json();
      updateDraft({ coverImage: j.url });
    } else {
      setMessage("Upload failed");
    }
  }, []);

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
        <div className="rounded-lg border border-neutral-200 bg-white/60 backdrop-blur-sm px-4 py-3 flex flex-col gap-3 md:flex-row md:items-end md:gap-4 text-[11px]">
          <div className="flex-1 min-w-[180px]">
            <label className="block font-medium mb-1 text-neutral-600">{t("filters.search")}</label>
            <input value={search} onChange={e => { setSearch(e.target.value); scheduleFetch(); }} placeholder={t("filters.searchPlaceholder")} className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400/40" />
          </div>
          <div className="min-w-[150px]">
            <label className="block font-medium mb-1 text-neutral-600">{t("filters.published")}</label>
            <select value={publishedFilter} onChange={e => { setPublishedFilter(e.target.value); scheduleFetch(); }} className="w-full rounded-md border border-neutral-300 bg-white px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400/40">
              <option value="ALL">{t("filters.all")}</option>
              <option value="true">{t("filters.published")}</option>
              <option value="false">{t("filters.unpublished")}</option>
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="block font-medium mb-1 text-neutral-600">{t("filters.sort")}</label>
            <select value={sort} onChange={e => { setSort(e.target.value); scheduleFetch(); }} className="w-full rounded-md border border-neutral-300 bg-white px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400/40">
              <option value="updated_desc">{t("filters.sortUpdated")}</option>
              <option value="name_asc">{t("filters.sortNameAsc")}</option>
              <option value="name_desc">{t("filters.sortNameDesc")}</option>
              <option value="created_desc">{t("filters.sortCreatedNewest")}</option>
              <option value="created_asc">{t("filters.sortCreatedOldest")}</option>
            </select>
          </div>
        </div>
      </div>
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
          {categories.map(cat => (
            <tr key={cat.id} className="bg-white/70 backdrop-blur hover:bg-white/90 transition rounded shadow [&_td]:py-2">
              <td className="px-2">
                {cat.coverImage ? (
                  <img src={cat.coverImage} alt="thumb" className="h-8 w-8 rounded-full object-cover border border-neutral-300" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] text-neutral-500 border border-neutral-300">—</div>
                )}
              </td>
              <td className="px-2 font-medium text-neutral-800 max-w-[280px] truncate">{cat.name}</td>
              <td className="px-2 text-[11px] text-neutral-500">{cat.slug}</td>
              <td className="px-2 text-[11px] text-neutral-500">{cat.languages || (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "th")}</td>
              <td className="px-2 text-xs">{cat.published ? t("publish.published") : t("publish.unpublished")}</td>
              <td className="px-2 text-right text-xs space-x-3">
                <button onClick={() => openEdit(cat)} className="text-neutral-600 hover:underline cursor-pointer">Edit</button>
                <button onClick={() => remove(cat)} className="text-red-600 hover:underline cursor-pointer">Delete</button>
              </td>
            </tr>
          ))}
          {!categories.length && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-neutral-400 text-sm">No categories yet</td>
            </tr>
          )}
        </tbody>
      </table>

      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !pending && setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-xl bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? t("editTitle") : t("new")}</h2>
              <button onClick={() => !pending && setModalOpen(false)} className="btn btn-ghost !px-3 !border-0">✕</button>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-sm">
              <div className="flex gap-2 mb-2 text-xs justify-end">
                {[(process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "th"), "en"].map(loc => (
                  <button key={loc} onClick={() => setActiveLocale(loc)} className={clsx(
                    "btn btn-sm",
                    activeLocale === loc ? "btn-secondary" : "btn-ghost"
                  )}>{loc}</button>
                ))}
              </div>
              {defaultLocale ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.name")}</label>
                    <input value={draft.name} onChange={e => { updateDraft({ name: e.target.value }); }} className="w-full border border-neutral-300 rounded px-2 py-1" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.slug")}</label>
                    <input value={draft.slug} disabled={!!editing} onChange={e => { slugManuallyEdited.current = true; updateDraft({ slug: e.target.value.toLowerCase() }); }} className="w-full border border-neutral-300 rounded px-2 py-1 disabled:opacity-60" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.name")} (EN)</label>
                    <input value={translationDraft.name || ""} onChange={e => setTranslationDraft((d: any) => ({ ...d, name: e.target.value }))} className="w-full border border-neutral-300 rounded px-2 py-1" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.excerpt")} (EN)</label>
                    <textarea rows={2} value={translationDraft.excerpt || ""} onChange={e => setTranslationDraft((d: any) => ({ ...d, excerpt: e.target.value }))} className="w-full border border-neutral-300 rounded px-2 py-2 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.description")} (EN)</label>
                    <textarea rows={5} value={translationDraft.description || ""} onChange={e => setTranslationDraft((d: any) => ({ ...d, description: e.target.value }))} className="w-full border border-neutral-300 rounded px-2 py-2 text-xs" />
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs text-neutral-600">
                    <input type="checkbox" checked={!!translationDraft.published} onChange={e => setTranslationDraft((d: any) => ({ ...d, published: e.target.checked }))} /> {t("publish.published")} (EN)
                  </label>
                </div>
              )}
              {defaultLocale && (
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-xs text-neutral-600">
                    <input type="checkbox" checked={!!draft.published} onChange={e => updateDraft({ published: e.target.checked })} /> {t("publish.published")}
                  </label>
                </div>
              )}
              {defaultLocale && (
                <div className="space-y-2">
                  <label className="text-neutral-500 flex flex-col gap-1" htmlFor="cover-image">
                    <span className="text-[11px] uppercase tracking-wide">{t("fields.coverImage")}</span>
                    <input id="cover-image" type="file" accept="image/*" onChange={onCoverImageChange} className="hidden" />
                    <span className="cursor-pointer">
                      {draft.coverImage ? (
                        <img src={draft.coverImage} alt="cover" className="h-40 w-full object-cover rounded border border-neutral-200" />
                      ) : (
                        <div className="h-40 w-full rounded border border-dashed border-neutral-300 flex items-center justify-center text-[11px] text-neutral-400 bg-neutral-50">
                          <span>{t("ui.noImage")}</span>
                        </div>
                      )}
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    {draft.coverImage && <button onClick={() => updateDraft({ coverImage: "" })} className="text-xs text-red-500 hover:underline">{t("ui.removeImage")}</button>}
                  </div>
                </div>
              )}
              {defaultLocale && (
                <>
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.excerpt")}</label>
                    <textarea value={draft.excerpt || ""} onChange={e => updateDraft({ excerpt: e.target.value })} rows={2} className="w-full border border-neutral-300 rounded px-2 py-2 text-xs resize-none" placeholder={t("ui.shortTeaserPlaceholder")} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("fields.description")}</label>
                    <textarea value={draft.description || ""} onChange={e => updateDraft({ description: e.target.value })} rows={5} className="w-full border border-neutral-300 rounded px-2 py-2 text-xs" placeholder={t("ui.longerDescriptionPlaceholder")} />
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/60">
              <div className="text-xs text-neutral-500">{message}</div>
              <div className="flex items-center gap-3">
                <button onClick={() => setModalOpen(false)} className="btn btn-ghost">{t("ui.cancel")}</button>
                <button onClick={saveCategory} disabled={pending} className="btn btn-secondary">{pending ? t("ui.saving") : t("ui.save")}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
