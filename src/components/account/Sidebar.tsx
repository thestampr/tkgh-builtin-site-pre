"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import clsx from "clsx";

interface SidebarProps { locale: string }

export default function AccountSidebar({ locale }: SidebarProps) {
  const { data: session } = useSession();
  const t = useTranslations("Account");
  const pathname = usePathname();
  const role = (session?.user as any)?.role;

  const baseLinks = [
    { href: (l: string) => `/${l}/account`, label: t("menu.overview"), roles: ["USER", "PROVIDER", "PUBLIC"] },
    { href: (l: string) => `/${l}/account/profile`, label: t("menu.profile"), roles: ["USER", "PROVIDER"] },
    { href: (l: string) => `/${l}/account/categories`, label: t("menu.categories"), roles: ["PROVIDER"] },
    { href: (l: string) => `/${l}/account/builtins`, label: t("menu.builtIns"), roles: ["PROVIDER"] },
    { href: (l: string) => `/${l}/account/settings`, label: t("menu.settings"), roles: ["PROVIDER"] }
  ];
  const links = baseLinks.filter(l => !role || l.roles.includes(role));

  return (
    <aside className="w-full md:w-52 shrink-0 space-y-4">
      <nav className="rounded-xl border border-neutral-200/70 bg-white/70 backdrop-blur p-3 text-sm flex md:flex-col gap-2 overflow-x-auto">

        {links.map(l => {
          const href = l.href(locale);
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2 rounded px-3 py-2 transition border text-xs tracking-wide uppercase",
                active ? "bg-secondary text-white border-neutral-900 shadow" : "border-neutral-200 text-neutral-700 hover:bg-neutral-100"
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}