"use client";

import type { Category } from "@/lib/api";
import clsx from "clsx";
import { useLocale } from "next-intl";
import Link from "next/link";

interface Props {
  category: Category;
}

export function CategoryButton({ category }: Props) {
  const { title, slug, provider } = category;
  const locale = useLocale();
  
  const providerId = provider?.id;
  const categoryHref = providerId
    ? `/${locale}/p/${providerId}/categories/${slug}`
    : `/${locale}/categories/${slug}`;

  return (
    <Link href={categoryHref}>
      <div className="max-w-24 truncate">
        <span 
          className={clsx(
            "inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-800 rounded",
            "hover:bg-slate-200 hover:text-slate-900 active:bg-slate-300",
            "transition-colors"
          )}
        >
          {title}
        </span>
      </div>
    </Link>
  );
}
