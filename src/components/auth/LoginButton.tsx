"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

interface LoginButtonProps { className?: string; locale?: string; }

export function LoginButton({ className, locale }: LoginButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const loc = locale || (pathname?.split('/')?.[1] || 'en');
  const loading = status === "loading";
  if (loading) return <span className={clsx("text-xs text-gray-400", className)}>...</span>;
  if (!session) {
    return (
      <button
        onClick={() => router.push(`/${loc}/login`)}
        className={clsx(
          "px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary/90",
          className
        )}
      >Login</button>
    )
  }
  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <Link href="/account" className="text-sm hover:underline">{session.user?.email}</Link>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="px-2 py-1 rounded-md text-xs font-medium bg-neutral-200 hover:bg-neutral-300"
      >Logout</button>
    </div>
  );
}
