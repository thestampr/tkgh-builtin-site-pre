import ProviderAccountSettings from "@/components/account/ProviderAccountSettings";
import { authOptions } from "@/lib/auth/options";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/${locale}/login`);
  const t = await getTranslations({ locale, namespace: "Account.ui.settings" });
  
  return (
    <div className="max-w-5xl mx-auto md:px-6 pb-10 space-y-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#8a6a40] via-[#a4814f] to-[#8a6a40]">{t("title")}</h1>
        <p className="text-sm text-neutral-500 mt-1">{t("subtitle")}</p>
      </div>
      <ProviderAccountSettings />
    </div>
  );
}
