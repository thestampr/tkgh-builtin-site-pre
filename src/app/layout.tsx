import { SessionClientProvider } from "@/components/providers/SessionClientProvider";
import { defaultMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import "./globals.css";
import ConfirmHost from "../components/modal/confirm-host";

export const metadata: Metadata = defaultMetadata;

RootLayout.getInitialProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      messages: {
        ...(await import(`../i18n/locales/${locale}.json`)).default,
      },
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "th";
  
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <title>{process.env.NEXT_PUBLIC_SITE_NAME || "Loading..."}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

        <style>
          {`
            @font-face {
              font-family: "Legitima";
              src: url('/fonts/Legitima-Italic.woff2') format('woff2'),
                  url('/fonts/Legitima-Regular.woff2') format('woff2');
              font-weight: 400;
              font-style: normal;
              font-display: swap;
            }
          `}
        </style>
      </head>

      <body className="min-h-screen relative flex flex-col">
        <SessionClientProvider>
          {children}
          <ConfirmHost />
        </SessionClientProvider>
      </body>
    </html>
  );
}