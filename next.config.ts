import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow common CMS or CDN domains as needed
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" }
    ]
  },
  experimental: {
    scrollRestoration: true,
  }
};
 
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
