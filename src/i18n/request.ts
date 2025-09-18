import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales } from "./navigation";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  
  const locale = requested && locales.includes(requested) 
  ? requested 
  : defaultLocale;

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default
  };
});