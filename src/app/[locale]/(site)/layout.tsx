import { ContactUsButton } from "@/components/ContactUsButton";
import { FooterHero } from "@/components/FooterHero";
import { ReactNode } from "react";

export default async function SiteLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {

  return (
    <>
      <main className="shrink-0 min-h-screen h-fit">
        {children}
      </main>
      <ContactUsButton />
      <FooterHero />
    </>
  );
}