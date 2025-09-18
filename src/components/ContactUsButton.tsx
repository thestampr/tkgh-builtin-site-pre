"use client";

import clsx from "clsx";
import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export function ContactUsButton() {
  const ctaUrl = process.env.NEXT_PUBLIC_CTA_URL || "";
  const t = useTranslations("Common");

  if (!ctaUrl) return null;

  return (
    <span data-global-cta className="sticky h-0 bottom-0 right-5 z-1 float-right ml-auto overflow-visible flex items-end"> 
    {/* This wrapper will make sticky element take no space */}
      <a
        href={ctaUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={t("lineChat")}
        className={clsx(
          "w-14 aspect-square rounded-full bg-secondary text-white shadow-xl hover:opacity-90 border border-divider/20",
          "translate-y-[-20px]",
          "flex items-center justify-center"
        )}
      >
        <MessageCircle size={24} />
      </a>
    </span>
  );
}