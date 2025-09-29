"use client";

import AppBar from "@/components/appbar";
import { LoginButton } from "@/components/auth/LoginButton";
import UserAvatar from "@/components/UserAvatar";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import clsx from "clsx";
import { ChevronUp, Menu, User } from "lucide-react";
import type { Session } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LocaleSwitcher from "./LocaleSwitcher";

type UserMenuProps = {
  session: Session | null;
  locale: string;
  showName?: boolean;
};

function UserMenu({ session, locale, showName }: UserMenuProps) {
  const tAccount = useTranslations("Account");
  const user = session?.user;
  const role = user?.role;

  return (
    <Popover className="relative">
      {({ close }) => (
        <>
          <PopoverButton className={clsx(
            "flex items-center gap-2 rounded-full group cursor-pointer",
            showName ? "w-full justify-start px-2 py-2 hover:bg-black/5 rounded-lg" : "px-1"
          )}>
            <UserAvatar padding={1} />
            {showName && (
              <span className="flex flex-col text-left">
                <span className="text-sm font-medium text-slate-900 line-clamp-1">{user?.name || user?.email}</span>
                <span className="text-xs text-gray-500 line-clamp-1">{user?.email}</span>
              </span>
            )}
          </PopoverButton>
          <PopoverPanel
            transition
            anchor="bottom end"
            className={clsx(
              "z-30 mt-2 w-56 rounded-xl border border-divider/50 bg-white/90 backdrop-blur-md shadow-lg p-1 text-sm text-slate-700",
              "transition data-[closed]:opacity-0 data-[closed]:-translate-y-1"
            )}
          >
            <div className="px-3 pt-3 pb-2 border-b border-divider/40">
              <p className="text-sm font-medium text-slate-900 line-clamp-1">{user?.name || user?.email}</p>
              {user?.email && <p className="text-xs text-gray-500 line-clamp-1">{user.email}</p>}
            </div>
            <div className="py-1 flex flex-col">
              {role === "PROVIDER" ? (
                <>
                  <Link
                    href={`/${locale}/account`}
                    onClick={close}
                    className="flex w-full items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/5 text-left"
                  >
                    <span className="flex-1">{tAccount("menu.overview")}</span>
                  </Link>
                  <Link
                    href={`/${locale}/account/profile`}
                    onClick={close}
                    className="flex w-full items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/5 text-left"
                  >
                    <span className="flex-1">{tAccount("menu.profile")}</span>
                  </Link>
                  <Link
                    href={`/${locale}/account/builtins`}
                    onClick={close}
                    className="flex w-full items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/5 text-left"
                  >
                    <span className="flex-1">{tAccount("menu.builtIns")}</span>
                  </Link>
                  <Link
                    href={`/${locale}/account/categories`}
                    onClick={close}
                    className="flex w-full items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/5 text-left"
                  >
                    <span className="flex-1">{tAccount("menu.categories")}</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={`/${locale}/account`}
                    onClick={close}
                    className="flex w-full items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/5 text-left"
                  >
                    <span className="flex-1">{tAccount("menu.profile")}</span>
                  </Link>
                </>
              )}
              <button
                onClick={() => { close(); signOut({ callbackUrl: `/${locale}` }) }}
                className="flex w-full items-center gap-2 px-3 py-2 mt-1 rounded-lg hover:bg-black/5 text-left cursor-pointer text-danger"
              >
                <span className="flex-1">{tAccount("menu.signOut")}</span>
              </button>
            </div>
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
}

interface LinkProps {
  href: string;
  label: string;
  title?: string;
};

export function NavBar() {
  const { data: session } = useSession();

  const locale = useLocale();
  const headerRef = useRef<HTMLElement>(null);

  const [open, setOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [hasExtended, setHasExtended] = useState(false);

  const tNav = useTranslations("Nav");
  const tAccount = useTranslations("Account");
  const pathname = usePathname() || `/${locale}`;

  const links = useMemo(
    () => [
      { href: `/${locale}`, label: tNav("home.label"), title: tNav("home.title") },
      { href: `/${locale}/boqservices`, label: tNav("drafting.label"), title: tNav("drafting.title") },
      { href: `/${locale}/categories`, label: tNav("categories.label"), title: tNav("categories.title") },
      { href: `/${locale}/built-in`, label: tNav("builtIn.label"), title: tNav("builtIn.title") },
      { href: `/${locale}/estimate`, label: tNav("estimate.label"), title: tNav("estimate.title") },
      { href: `/${locale}/contact`, label: tNav("contact.label"), title: tNav("contact.title") }
    ],
    [locale, tNav]
  );

  const providerLinks = [
    { href: `/${locale}/account`, label: tAccount("menu.overview") },
    { href: `/${locale}/account/profile`, label: tAccount("menu.profile") },
    { href: `/${locale}/account/builtins`, label: tAccount("menu.builtIns") },
    { href: `/${locale}/account/categories`, label: tAccount("menu.categories") },
  ]
  const userLinks = [
    { href: `/${locale}/account`, label: tAccount("menu.profile") }
  ];

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  useEffect(() => {
    // clear data-extended attribute from body
    const bodyElement = document.body;
    if (bodyElement) {
      bodyElement.removeAttribute("data-extended");
      const check = () => setHasExtended(bodyElement.getAttribute("data-extended") === "true");
      setTimeout(check, 0);
      setTimeout(check, 1000);
    }
    setOpen(false);
  }, [pathname]);

  // Scroll and resize handlers
  const onScroll = useCallback(() => {
    if (!headerRef.current) return;
    const { pageYOffset, scrollY } = window;
    const isAtTop = pageYOffset < headerRef.current.offsetHeight;
    setAtTop(isAtTop);
  }, [headerRef.current]);

  const onSizeChange = useCallback(() => {
    const { innerWidth } = window;
    if (innerWidth > 768) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onSizeChange);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onSizeChange);
    }
  }, []);

  const isPathActive = useCallback((href: string): boolean => {
    return href === pathname;
  }, [pathname]);

  const Anchors = ({ links }: { links: LinkProps[] }) => {
    const anchorClass = clsx(
      "block px-4 py-2 rounded-md",
      "text-gray-500 hover:bg-neutral-400/10",
      "transition-colors duration-100 ease-in-out"
    );
    return links.map((l) => {
      const active = isPathActive(l.href);
      return (
        <Link
          key={l.href}
          href={l.href}
          title={l.title}
          data-title={l.label}
          className={clsx(
            anchorClass,
            hasExtended
              ? active
                ? atTop
                  ? "text-slate-900 lg:text-white font-medium"
                  : "text-slate-900 font-medium"
                : ""
              : active
                ? "text-slate-900 font-medium"
                : "text-divider"
          )}
        >
          {l.label}
        </Link>
      );
    });
  };

  const iconButtonClass = clsx(
    "hover:bg-neutral-400/10",
    "p-2 cursor-pointer rounded-md aspect-square",
    "transition-colors duration-300 ease-in-out",
    hasExtended ? "" : "text-gray-500"
  );

  const headerClass = atTop && !open
    ? `bg-transparent border-transparent ${hasExtended ? "**:text-white/60" : "text-slate-900"}`
    : open ? "bg-white border-transparent" : "bg-white/80 backdrop-blur-lg";

  return (
    <>
      <div className={clsx(
        "fixed inset-0 z-10 md:hidden bg-black/40",
        "transition-all duration-300",
        open ? "visible opacity-100" : "invisible opacity-0"
      )}
        onClick={() => setOpen(false)}
      />

      <AppBar
        key={locale}
        primary
        floating
        pinned={false}
        backdropBlur
      >
        <header 
          ref={headerRef}
          className={clsx(
          "min-h-14 items-center",
          "px-4 lg:px-12 xl:px-20",
          "transition-all duration-300 ease-in-out **:z-9999",
          headerClass
        )}>
          <div className="min-h-14 mx-auto pl-4 lg:px-6 py-1 md:py-0 flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-4">
              <Link href={`/${locale}`} className={clsx(
                "inline-flex items-baseline gap-2 md:gap-4"
              )}>
                <span className="text-2xl md:text-3xl font-serif font-bold !text-primary">
                  {process.env.NEXT_PUBLIC_BRAND_ALIAS}
                </span>
                <span className="text-sm md:text-md lg:text-lg font-semibold font-serif">
                  {process.env.NEXT_PUBLIC_SITE_NAME}
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <nav className={`w-full space-x-2 px-4 hidden lg:flex`}>
                <Anchors links={links} />
              </nav>

              <span className="hidden lg:inline-flex">
                {session?.user
                  ? <UserMenu locale={locale} session={session} />
                  : <LoginButton />
                }
              </span>

              <LocaleSwitcher className={iconButtonClass} />

              <span className="lg:hidden">
                {session?.user
                  ? <button className={clsx(iconButtonClass, "!p-1")} onClick={() => setOpen(!open)}>
                    <UserAvatar padding={1} />
                  </button>
                  : <button className={iconButtonClass} onClick={() => setOpen(!open)}>
                    {open ? <ChevronUp size={24} /> : <Menu size={24} />}
                  </button>
                }
              </span>
            </div>
          </div>
          <div className={clsx(
            "absolute left-0 right-0 -z-20 rounded-b-3xl flex lg:hidden lg:translate-y-0 p-4",
            "bg-white border-b border-divider/10 shadow-md",
            "transition-all duration-300",
            open ? "-translate-y-1 visible opacity-100 ease-out" : "-translate-y-120 invisible opacity-0 ease-in"
          )}>
            <div className="flex flex-col gap-4 w-full">
              <nav className="flex flex-col gap-2">
                <Anchors links={links} />
              </nav>
              <div className="pt-4 border-t border-divider/40 flex flex-col gap-3">
                {session?.user ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 px-3">
                      <UserAvatar letterIcon />
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-medium text-slate-900 line-clamp-1">{session.user?.name || session.user?.email}</span>
                        {session.user?.email && <span className="text-xs text-gray-500 line-clamp-1">{session.user.email}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {session.user?.role === "PROVIDER" ? <Anchors links={providerLinks} /> : <Anchors links={userLinks} />}

                      <button 
                        className="mt-1 px-4 py-2 rounded-lg hover:bg-black/5 text-left text-danger"
                        onClick={() => signOut({ callbackUrl: `/${locale}` })} 
                      >
                        {tAccount("menu.signOut")}
                      </button>
                    </div>
                  </div>
                ): (
                  <LoginButton className="inline-flex w-full justify-center" />
                )}
              </div>
            </div>
          </div>
        </header>
      </AppBar>
    </>
  );
}