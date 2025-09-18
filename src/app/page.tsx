import { redirect } from "@/i18n/navigation";
import { defaultLocale } from "@/i18n/navigation";

export default function RootRedirectPage() {
  // Redirect root "/" to the default locale, e.g., "/en".
  redirect({ href: '/', locale: defaultLocale });
}