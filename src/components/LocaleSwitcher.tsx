"use client";

import { locales } from "@/i18n/navigation";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import clsx from "clsx";
import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

interface Props {
  className?: string;
}

function replaceLocaleInPath(pathname: string, nextLocale: string) {
  const parts = pathname.split("/");
  if (parts.length >= 2) {
    parts[1] = nextLocale;
    return parts.join("/") || `/${nextLocale}`;
  }
  return `/${nextLocale}`;
}

export default function LocaleSwitcher({ className }: Props) {
  const locale = useLocale();
  const tLocale = useTranslations("Locale");
  const pathname = usePathname() || `/${locale}`;
  const router = useRouter();

  const onChangeLocale = useCallback((nextLocale: string) => {
    const nextPath = replaceLocaleInPath(pathname, nextLocale);
    router.replace(nextPath, { scroll: false });
  }, [pathname, router]);

  if (locales.length <= 1) return null;

  return (
    <Popover className="relative">
      <PopoverButton className={className} >
        <div className="w-6">{locale.toUpperCase()}</div>
      </PopoverButton>
      <PopoverPanel
        transition
        anchor="bottom end"
        className={clsx(
          "z-30 mt-2 w-48 rounded-xl border border-divider/50 bg-white/90 backdrop-blur-md shadow-lg p-1 text-sm",
          "transition duration-200 ease-in-out",
          "[--anchor-gap:var(--spacing-5)] data-[closed]:-translate-y-1 data-[closed]:opacity-0"
        )}
      >
        <div className="flex flex-col gap-1">
          {locales.map(l => {
            const isActive = l === locale;
            return (
              <button
                key={l}
                onClick={() => onChangeLocale(l)}
                className={clsx(
                  "flex w-full items-center gap-2 px-3 py-2 rounded-lg text-left cursor-pointer",
                  "hover:bg-black/5",
                  isActive ? "text-primary" : "text-slate-600"
                )}
              >
                <span className="flex-1">{tLocale(l)}</span>
                {isActive && <Check size={16} className="opacity-80" />}
              </button>
            );
          })}
        </div>
      </PopoverPanel>
    </Popover>
  );
}