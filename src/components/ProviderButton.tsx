"use client";

import UserAvatar from "@/components/common/UserAvatar";
import type { ProviderInfo } from "@/lib/api";
import clsx from "clsx";
import { useLocale } from "next-intl";
import Link from "next/link";

type SizeKind = "sm" | "md";

interface Props {
  provider: ProviderInfo;
  size?: SizeKind;
  ghost?: boolean;
  padding?: number;
}

export default function ProviderButton(props: Props) {
  const { provider, size = "sm", ghost = false, padding = 0 } = props;
  const locale = useLocale();

  const sizeClasses = {
    sm: "text-sm",
    md: "text-md",
  };

  const imageSize = {
    sm: 24,
    md: 36,
  };

  const textClasses = ghost ? "text-xs text-slate-500" : "font-medium text-slate-900";

  return (
    <Link
      href={`/${locale}/p/${provider.id}`}
      onClick={(e) => e.stopPropagation()}
      className={clsx(
        "flex items-center gap-2 group/provider-btn",
        sizeClasses[size]
      )}>
      <UserAvatar 
        src={provider.avatarUrl || undefined} 
        name={provider.displayName || "Provider"}
        className="bg-slate-200"
        padding={padding} 
        size={imageSize[size]} 
        sessionUser={false} 
        letterIcon 
      />
      <span 
        className={clsx(
          "truncate group-hover/provider-btn:underline",
          textClasses, 
        )}>
        {provider.displayName || "Provider"}
      </span>
    </Link>
  );
}