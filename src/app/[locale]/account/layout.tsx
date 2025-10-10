import AccountSidebar from "@/components/account/Sidebar";
import { Footer } from "@/components/Footer";
import { authOptions } from "@/lib/auth/options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/${locale}/login`);

  const role = session.user.role;

  const content = role === "PROVIDER"
    ? (
      <div className="md:flex md:items-start gap-8 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="md:w-56 flex-shrink-0 mb-6 md:mb-0 sticky top-8 self-start">
          <AccountSidebar locale={locale} />
        </div>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    ) : (
      <div className="max-w-5xl mx-auto w-full px-6 py-10">
        {children}
      </div>
    );

  return (
    <>
      <main className="shrink-0 min-h-screen h-fit">
        {content}
      </main>
      <Footer />
    </>
  );
}
