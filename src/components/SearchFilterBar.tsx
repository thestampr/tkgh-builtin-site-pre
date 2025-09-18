"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface SearchFilterBarProps {
  variant: "categories" | "builtins";
  categories?: { slug: string; title: string }[];
  inline?: boolean;
}
export default function SearchFilterBar({ variant, categories, inline }: SearchFilterBarProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const [q, setQ] = useState(sp.get("q") || "");
  const [order, setOrder] = useState(sp.get("order") || "");
  const [cat, setCat] = useState(sp.get("cat") || "");
  const [min, setMin] = useState(sp.get("min") || "");
  const [max, setMax] = useState(sp.get("max") || "");
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setQ(sp.get("q") || ""); }, [sp]);

  function apply() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (order) params.set("order", order);
    if (variant === "builtins") {
      if (cat) params.set("cat", cat);
      if (min) params.set("min", min);
      if (max) params.set("max", max);
    }
    router.replace(pathname + (params.toString() ? "?" + params.toString() : ""));
    setDirty(false);
  }

  function reset() {
    setQ(""); setOrder(""); setCat(""); setMin(""); setMax(""); setDirty(false);
    router.replace(pathname);
  }

  useEffect(() => {
    if (!inline) return;
    setDirty(true);
    apply();
  }, [q, order, cat, min, max, inline]);

  const baseInput = "rounded-full border border-slate-300/80 bg-white/70 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#a4814f]/30 focus:border-[#a4814f]/50 transition";

  if (inline) {
    return (
      <div className="mt-4 mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-6 text-sm">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="flex-1 relative">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" className={baseInput + " w-full"} />
            {q && <button onClick={() => setQ("")} className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 text-xs">✕</button>}
          </div>
          <select value={order} onChange={e => setOrder(e.target.value)} className={baseInput + " w-40"}>
            <option value="">Order</option>
            <option value="popular">Popular</option>
            <option value="newest">Newest</option>
            {variant === "categories" && <option value="name_desc">Name Z-A</option>}
            {variant === "builtins" && <>
              <option value="price_low">Price Low</option>
              <option value="price_high">Price High</option>
              <option value="title_desc">Title Z-A</option>
            </>}
          </select>
          {variant === "builtins" && (
            <>
              <select value={cat} onChange={e => setCat(e.target.value)} className={baseInput + " w-40"}>
                <option value="">All Categories</option>
                {categories?.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
              </select>
              <input value={min} onChange={e => setMin(e.target.value)} placeholder="Min" className={baseInput + " w-28"} />
              <input value={max} onChange={e => setMax(e.target.value)} placeholder="Max" className={baseInput + " w-28"} />
            </>
          )}
          {(dirty || q || order || cat || min || max) && (
            <button onClick={reset} className="text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-2 rounded-full border border-slate-300/70 bg-white/60">Reset</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10 rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white/90 to-slate-50/70 backdrop-blur-sm shadow-sm p-4 md:p-5 text-sm">
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-[11px] font-medium tracking-wide text-slate-500">Search</label>
          <div className="relative">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && apply()}
              placeholder="keyword"
              className="w-full rounded-full border border-slate-300/80 bg-white/70 px-4 py-2 pr-10 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#a4814f]/30 focus:border-[#a4814f]/50 transition"
            />
            {q && <button onClick={() => setQ("")} className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 text-xs">✕</button>}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium tracking-wide text-slate-500">Order</label>
          <select
            value={order}
            onChange={e => { setOrder(e.target.value); }}
            className="rounded-full border border-slate-300/80 bg-white/70 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#a4814f]/30 focus:border-[#a4814f]/50 transition"
          >
            <option value="">Default</option>
            <option value="popular">Popular</option>
            <option value="newest">Newest</option>
            {variant === "categories" && <option value="name_desc">Name Z-A</option>}
            {variant === "builtins" && <>
              <option value="price_low">Price Low</option>
              <option value="price_high">Price High</option>
              <option value="title_desc">Title Z-A</option>
            </>}
          </select>
        </div>
        {variant === "builtins" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium tracking-wide text-slate-500">Category</label>
              <select
                value={cat}
                onChange={e => setCat(e.target.value)}
                className="rounded-full border border-slate-300/80 bg-white/70 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#a4814f]/30 focus:border-[#a4814f]/50 transition"
              >
                <option value="">All</option>
                {categories?.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium tracking-wide text-slate-500">Min Price</label>
              <input
                value={min}
                onChange={e => setMin(e.target.value)}
                placeholder="0"
                className="rounded-full border border-slate-300/80 bg-white/70 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#a4814f]/30 focus:border-[#a4814f]/50 transition"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium tracking-wide text-slate-500">Max Price</label>
              <input
                value={max}
                onChange={e => setMax(e.target.value)}
                placeholder=""
                className="rounded-full border border-slate-300/80 bg-white/70 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#a4814f]/30 focus:border-[#a4814f]/50 transition"
              />
            </div>
          </>
        )}
        <div className="flex items-end gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={apply}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white px-5 py-2 text-xs font-medium shadow hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-neutral-800"
            >
              Apply
            </button>
            <button
              onClick={reset}
              type="button"
              className="rounded-full border border-slate-300/80 bg-white/60 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#a4814f]/30"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
