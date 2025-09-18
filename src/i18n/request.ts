import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  
  const supported = (process.env.NEXT_PUBLIC_SUPPORTED_LOCALES || "en,th").split(",");
  const locale = requested && supported.includes(requested) 
  ? requested 
  : process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en";

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default
  };
});