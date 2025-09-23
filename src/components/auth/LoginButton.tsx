"use client";
import clsx from "clsx";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface LoginButtonProps {
  className?: string;
}

export function LoginButton({ className }: LoginButtonProps) {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const t = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();
  const loading = status === "loading";
  if (loading) return <span className={clsx("text-xs text-gray-400", className)}>...</span>;
  if (!session) {
    return (
      <button
        onClick={() => router.push(`/${locale}/login`)}
        className={clsx(
          "px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary/90 text-nowrap cursor-pointer",
          className
        )}
      >{t("signIn")}</button>
    )
  }
  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <Link href="/account" className="text-sm hover:underline">{session.user?.email}</Link>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="px-2 py-1 rounded-md text-xs font-medium bg-neutral-200 hover:bg-neutral-300 text-nowrap cursor-pointer"
      >{t("signOut")}</button>
    </div>
  );
}
