import { defineRouting } from "next-intl/routing";

export const locales = (process.env.NEXT_PUBLIC_SUPPORTED_LOCALES || "th,en").split(",");
export const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "th";
 
export const routing = defineRouting({
  locales, // A list of all locales that are supported
  defaultLocale, // Used when no locale matches
});