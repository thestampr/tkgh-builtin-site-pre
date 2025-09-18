"use client";

import { useTranslations } from "next-intl";

export function LineChatButton() {
  const lineUrl = process.env.NEXT_PUBLIC_LINE_URL || "";
  const t = useTranslations("Common");

  if (!lineUrl) return null;

  return (
    <a
      href={lineUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={t("lineChat")}
      className="w-fit sticky float-right bottom-5 right-5 ml-auto mb-5 z-50 rounded-full bg-[#06C755] text-white px-5 py-3 shadow-xl hover:opacity-90"
    >
      {t("lineChat")}
    </a>
  );
}