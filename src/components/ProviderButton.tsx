"use client";

import type { ProviderInfo } from "@/lib/api";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Props {
  provider: ProviderInfo;
  size?: "sm" | "md";
  ghost?: boolean;
}

export default function ProviderButton({ provider, size = "md", ghost }: Props) {
  const params = useParams();
  const { locale } = params;

  const sizeClasses = {
    sm: "text-sm",
    md: "text-md",
  };

  const iconClasses = {
    sm: "size-6",
    md: "size-9",
  };

  const textClasses = ghost ? "text-xs text-slate-500" : "font-medium text-slate-900";

  return (
    <Link 
      href={`/${locale}/p/${provider.id}`} 
      onClick={(e) => e.stopPropagation()}
      className={clsx(
        "flex items-center gap-2 hover:underline",
        sizeClasses[size]
      )}>
      <span className={clsx(
        "relative inline-block rounded-full overflow-hidden bg-slate-200 shrink-0",
        iconClasses[size]
      )}>
        {provider.avatarUrl ? (
          <Image src={provider.avatarUrl} alt={provider.displayName || "avatar"} fill className="object-cover" />
        ) : (
          <span className="flex items-center justify-center w-full h-full text-[10px] font-medium text-slate-500">PR</span>
        )}
      </span>
      <span className={clsx(textClasses, "truncate")}>{provider.displayName || "Provider"}</span>
    </Link>
  );
}