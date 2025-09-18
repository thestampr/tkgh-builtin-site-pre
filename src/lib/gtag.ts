export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

export const pageview = (url: string) => {
  if (!GA_ID) return;
  // @ts-ignore
  window.gtag("config", GA_ID, { page_path: url });
};