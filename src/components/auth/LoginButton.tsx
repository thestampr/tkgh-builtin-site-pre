"use client";

import clsx from "clsx";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  className?: string;
}

export function LoginButton({ className }: Props) {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const t = useTranslations("Common");
  const router = useRouter();
  const loading = status === "loading";

  if (loading) return <span className={clsx("text-xs text-gray-400", className)}>...</span>;

  if (!session) {
    return (
      <button
        onClick={() => router.push(`/${locale}/login`)}
        className={clsx(
          "btn btn-primary btn-sm",
          className
        )}
      >
        {t("signIn")}
      </button>
    )
  }
  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <Link href="/account" className="text-btn text-ghost text-sm">{session.user?.email}</Link>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="btn btn-ghost btn-sm"
      >
        {t("signOut")}
      </button>
    </div>
  );
}
