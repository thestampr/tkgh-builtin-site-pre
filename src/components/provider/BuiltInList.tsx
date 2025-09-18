"use client";
// NOTE: Legacy component kept temporarily for reference. Use BuiltInsManager instead.
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface BuiltInListProps {
  initialItems: any[];
  locale: string;
}

export default function BuiltInList({ initialItems, locale }: BuiltInListProps) {
  const [items, setItems] = useState(initialItems);
  const t = useTranslations("Account");
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function createItem() {
    setMessage(null);
    startTransition(async () => {
      setCreating(true);
      const res = await fetch("/api/provider/builtins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug })
      });
      setCreating(false);
      if (!res.ok) {
        setMessage("Create failed");
        return;
      }
      const json = await res.json();
      setItems([json.item, ...items]);
      setTitle("");
      setSlug("");
      setMessage("Created");
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-6 pb-10 space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#8a6a40] via-[#a4814f] to-[#8a6a40]">{t("summary.builtIns")}</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage your built-in items, drafts & published entries.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input placeholder={t("tables.recent")} value={title} onChange={e => setTitle(e.target.value)} className="border border-neutral-300 rounded px-2 py-1 text-sm" />
          <input placeholder="slug" value={slug} onChange={e => setSlug(e.target.value)} className="border border-neutral-300 rounded px-2 py-1 text-sm" />
          <button disabled={!title || !slug || pending} onClick={createItem} className="px-3 py-2 rounded bg-neutral-900 text-white disabled:opacity-50">New</button>
          {message && <span className="text-xs text-neutral-500">{message}</span>}
        </div>
      </div>
      <table className="w-full text-sm border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
            <th className="py-1 px-2">Title</th>
            <th className="py-1 px-2">{t("tables.status")}</th>
            <th className="py-1 px-2">{t("tables.views")}</th>
            <th className="py-1 px-2">{t("tables.updated")}</th>
            <th className="py-1 px-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="bg-white/70 backdrop-blur hover:bg-white/90 transition rounded shadow [&_td]:py-2">
              <td className="px-2 font-medium text-neutral-800 max-w-[260px] truncate">{item.title}</td>
              <td className="px-2"><span className="text-xs px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50">{item.status}</span></td>
              <td className="px-2 text-neutral-600 text-xs">{item.viewCount ?? 0}</td>
              <td className="px-2 text-neutral-500 text-xs">{new Date(item.updatedAt).toLocaleDateString()}</td>
              <td className="px-2 text-right">
                <Link href={`/${locale}/account/builtins/${item.id}`} className="text-xs underline text-neutral-600 hover:text-neutral-900">Edit</Link>
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-neutral-400 text-sm">{t("empty.noBuiltIns")}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
