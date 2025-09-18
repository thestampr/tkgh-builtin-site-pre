import type { Metadata } from "next";

const siteName = process.env.NEXT_PUBLIC_BRAND_NAME || "Your Brand";
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const defaultMetadata: Metadata = {
  title: {
    template: `%s | ${siteName}`,
    default: siteName
  },
  metadataBase: new URL(baseUrl),
  description: "Quality built-in and construction services. 2D/3D design with BOQ.",
  openGraph: {
    type: "website",
    siteName,
    url: baseUrl
  },
  twitter: {
    card: "summary_large_image"
  },
  alternates: {
    canonical: baseUrl
  }
};