"use client";
import { useEffect, useState, useTransition } from "react";

interface BuiltInEditorProps {
    initialItem: any;
    locale: string;
}

const FIELD_LIST = ["title", "slug", "summary", "content", "price", "categoryId", "ctaLabel", "ctaUrl", "icon", "styleJson", "layout", "coverImage", "galleryJson"];

export default function BuiltInEditor({ initialItem, locale }: BuiltInEditorProps) {
    const [draft, setDraft] = useState<any>(() => ({ ...initialItem }));
    const [saving, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);

    function update<K extends string>(k: K, v: any) {
        setDraft((d: any) => ({ ...d, [k]: v }));
    }

    function saveDraft() {
        setMessage(null);
        startTransition(async () => {
            const payload: any = {};
            FIELD_LIST.forEach(k => { if (draft[k] !== undefined) payload[k] = draft[k]; });
            const res = await fetch(`/api/provider/builtins/${initialItem.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            setMessage(res.ok ? "Draft saved" : "Save failed");
        });
    }
    function publish() {
        setMessage(null);
        startTransition(async () => {
            const res = await fetch(`/api/provider/builtins/${initialItem.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "publish" }) });
            setMessage(res.ok ? "Published" : "Publish failed");
        });
    }
    function unpublish() {
        startTransition(async () => {
            const res = await fetch(`/api/provider/builtins/${initialItem.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unpublish" }) });
            setMessage(res.ok ? "Unpublished" : "Failed");
        });
    }
    function destroyItem() {
        if (!confirm("Delete item?")) return;
        startTransition(async () => {
            const res = await fetch(`/api/provider/builtins/${initialItem.id}`, { method: "DELETE" });
            if (res.ok) {
                window.location.href = `/${locale}/account/builtins`;
            } else setMessage("Delete failed");
        });
    }

    return (
        <div className="max-w-5xl mx-auto md:px-6 pb-10 space-y-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#8a6a40] via-[#a4814f] to-[#8a6a40]">Edit Built-in</h1>
                    <p className="text-sm text-neutral-500 mt-1">Manage content, metadata & publish state.</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <button onClick={saveDraft} disabled={saving} className="px-3 py-2 rounded bg-neutral-900 text-white disabled:opacity-50">Save Draft</button>
                    <button onClick={publish} disabled={saving} className="px-3 py-2 rounded bg-[#8a6a40] text-white disabled:opacity-50">Publish</button>
                    <button onClick={unpublish} disabled={saving} className="px-3 py-2 rounded bg-neutral-200 text-neutral-700">Unpublish</button>
                    <button onClick={destroyItem} disabled={saving} className="px-3 py-2 rounded bg-red-600 text-white">Delete</button>
                    {message && <span className="text-neutral-500">{message}</span>}
                </div>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                <form onSubmit={e => { e.preventDefault(); saveDraft(); }} className="space-y-5">
                    <TextField label="Title" value={draft.title || ""} onChange={v => update("title", v)} />
                    <TextField label="Slug" value={draft.slug || ""} onChange={v => update("slug", v)} />
                    <TextField label="Summary" value={draft.summary || ""} onChange={v => update("summary", v)} textarea rows={3} />
                    <TextField label="Content (Markdown)" value={draft.content || ""} onChange={v => update("content", v)} textarea rows={8} />
                    <TextField label="Price" value={draft.price ?? ""} onChange={v => update("price", v ? parseInt(v, 10) : null)} type="number" />
                    <TextField label="Category ID" value={draft.categoryId || ""} onChange={v => update("categoryId", v || null)} />
                    <TextField label="CTA Label" value={draft.ctaLabel || ""} onChange={v => update("ctaLabel", v)} />
                    <TextField label="CTA URL" value={draft.ctaUrl || ""} onChange={v => update("ctaUrl", v)} />
                    <TextField label="Icon" value={draft.icon || ""} onChange={v => update("icon", v)} />
                    <TextField label="Layout" value={draft.layout || ""} onChange={v => update("layout", v)} placeholder="DEFAULT | GALLERY | FEATURED" />
                    <TextField label="Style JSON" value={draft.styleJson || ""} onChange={v => update("styleJson", v)} textarea rows={4} mono />
                    <TextField label="Cover Image URL" value={draft.coverImage || ""} onChange={v => update("coverImage", v)} />
                    <TextField label="Gallery JSON" value={draft.galleryJson || ""} onChange={v => update("galleryJson", v)} textarea rows={3} mono />
                    <button type="submit" className="px-4 py-2 rounded bg-neutral-900 text-white text-sm">Save Draft</button>
                </form>
                <div className="space-y-4">
                    <h2 className="text-sm font-medium text-neutral-600">Preview (draft values)</h2>
                    <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4 text-sm">
                        <div className="font-semibold text-lg">{draft.title || "Untitled"}</div>
                        <div className="text-neutral-500 text-xs uppercase tracking-wide">Layout: {draft.layout || "DEFAULT"}</div>
                        <div className="text-neutral-700 whitespace-pre-wrap text-sm leading-relaxed">{draft.summary || "No summary yet."}</div>
                        <div className="text-neutral-500 text-xs">CTA: {draft.ctaLabel ? `${draft.ctaLabel} → ${draft.ctaUrl}` : "—"}</div>
                        <div className="text-neutral-500 text-xs">Icon: {draft.icon || "—"}</div>
                        <div className="text-neutral-500 text-xs">Category: {draft.categoryId || "—"}</div>
                        <div className="text-neutral-500 text-xs">Price: {draft.price ?? "—"}</div>
                        <div className="text-neutral-500 text-xs break-all">Cover: {draft.coverImage || "—"}</div>
                        <div className="text-neutral-500 text-xs break-all">Gallery: {draft.galleryJson || "—"}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TextField({ label, value, onChange, textarea, rows = 2, type = "text", mono, placeholder }: { label: string; value: any; onChange: (v: string) => void; textarea?: boolean; rows?: number; type?: string; mono?: boolean; placeholder?: string }) {
    const cls = `w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white ${mono ? "font-mono text-xs" : ""}`;
    return (
        <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</label>
            {textarea ? (
                <textarea value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} rows={rows} className={cls} />
            ) : (
                <input value={value} placeholder={placeholder} type={type} onChange={e => onChange(e.target.value)} className={cls} />
            )}
        </div>
    );
}
