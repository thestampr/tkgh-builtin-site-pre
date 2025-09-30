"use client";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm opacity-60">© {year} {process.env.NEXT_PUBLIC_BRAND_NAME}. All rights reserved.</p>
          <div className="flex gap-4 text-sm *:hover:underline *:underline-offset-2">
            <a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://www.youtube.com" target="_blank" rel="noreferrer">YouTube</a>
            <a href="/sitemap.xml">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}