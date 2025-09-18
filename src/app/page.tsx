import { redirect } from "@/i18n/navigation";
import { defaultLocale } from "@/i18n/navigation";

export default function RootRedirectPage() {
  redirect({ href: '/', locale: defaultLocale });
}