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
      <div className="md:flex md:items-start gap-8 max-w-7xl mx-auto w-full px-6 py-6 md:py-10">
        <div className="md:w-56 flex-shrink-0 mb-6 md:mb-0 sticky top-4 md:top-0 self-start">
          <div className="md:fixed top-0 md:pt-24 pb-8 border-0 border-r-divider md:border-r md:h-full md:-z-1 overflow-scroll">
            <AccountSidebar />
          </div>
        </div>
        <div className="flex-1 min-w-0 !-z-0">
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
