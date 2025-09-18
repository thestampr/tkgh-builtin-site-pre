import { Footer } from "@/components/Footer";
import { ProviderCTA } from "@/components/ProviderCTA";
import { getProviderPublicProfile } from "@/lib/api";
import { redirect } from "next/navigation";

export default async function ProviderPageLayout({
  children,
  params
}: {
  children: React.ReactNode,
  params: Promise<{ locale: string, providerId: string }>;
}) {
  const { locale, providerId } = await params;

  const profile = await getProviderPublicProfile(providerId, locale);
  if (!profile) return redirect("/404");

  return (
    <>
      <main className="shrink-0 min-h-screen h-fit">
        {children}
      </main>
      {profile?.cta && <ProviderCTA config={profile.cta} />}
      <Footer />
    </>
  );
}