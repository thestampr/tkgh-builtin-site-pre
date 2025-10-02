"use client";

import clsx from "clsx";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface Props {
  href?: string;
  historyBack?: boolean;
}

export default function BackButton(props: Props) {
  const { href, historyBack } = props;
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const handleBack = () => {
    if (historyBack || !href) return router.back();

    router.push(href);
  };

  return (
    <button
      onClick={handleBack}
      className={clsx(
        "pl-1 pr-2 py-1 rounded-md hover:bg-gray-100 cursor-pointer",
        "text-slate-600 text-sm transition-colors ",
        "inline-flex items-center gap-1"
      )}
    >
      <ChevronLeft size={18} /> {tCommon("back")}
    </button>
  );
}