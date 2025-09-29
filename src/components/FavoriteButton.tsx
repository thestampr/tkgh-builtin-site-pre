"use client";

import clsx from "clsx";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface FavoriteButtonProps {
  builtInId: string;
  iconButton?: boolean; // if true, render as icon button only
  initial?: boolean | null; // allow server-provided (future) or null to fetch
  className?: string;
}

export function FavoriteButton({ builtInId, initial = null, className = "", iconButton = false }: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [favorited, setFavorited] = useState<boolean | null>(initial);
  const [loading, setLoading] = useState(false);
  const t = useTranslations("Common");
  const router = useRouter();

  useEffect(() => {
    if (favorited !== null) return; // already have state
    let cancelled = false;
    fetch(`/api/favorites/${builtInId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled && d) setFavorited(!!d.favorited); })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [builtInId, favorited]);

  async function toggle() {
    if (!session) {
      return router.push(`/login?redirect=${encodeURIComponent(window.location.href)}`);
    }
    if (loading) return;
    setLoading(true);
    setFavorited(prev => prev === null ? true : !prev);
    try {
      const res = await fetch(`/api/favorites/${builtInId}`, { method: "POST" });
      if (!res.ok) throw new Error("fail");
      const data = await res.json();
      setFavorited(!!data.favorited);
    } catch (e) {
      setFavorited(prev => prev === null ? null : !prev); // rollback
      const msg = e instanceof Error ? e.message : "Error";
      console.error(`Failed to update favorite: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  const buttonClassName = iconButton
    ? "rounded-full bg-white/85 backdrop-blur p-2 shadow-sm border border-slate-200/80 hover:scale-105 transition"
    : clsx(
      "inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm transition",
      favorited
        ? "bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100"
        : "bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-50",
      className
    );

  const HeartIcon = ({ className }: { className?: string }) =>
    // Some svg better than lucide-react's for this purpose?
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={favorited ? "#e11d48" : "none"}
      strokeWidth={1.5}
      stroke={favorited ? "#e11d48" : "#1f2937"}
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>;

  return (
    <button
      type="button"
      aria-label={favorited ? "Unfavorite" : "Favorite"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      className={clsx(
        "cursor-pointer",
        buttonClassName,
      )}
    >
      {iconButton
        ? <HeartIcon className="w-5 h-5" />
        : <>
          <HeartIcon className="w-4 h-4" />
          <span className="ml-2 text-xs font-medium">{favorited ? t("saved") : t("save")}</span>
        </>
      }
    </button>
  );
}
