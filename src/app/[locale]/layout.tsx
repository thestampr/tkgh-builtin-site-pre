import { NavBar } from "@/components/NavBar";
import { ToastProvider } from "@/hooks/useToast";
import { locales } from "@/i18n/navigation";
import { defaultMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import "../globals.css";

export const metadata: Metadata = defaultMetadata;

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ToastProvider defaultzIndex={60} defaultPosition="bottom">
        <main className="shrink-0 min-h-screen h-fit">
          <NavBar />
          {children}
        </main>
      </ToastProvider>
    </NextIntlClientProvider>
  );
}