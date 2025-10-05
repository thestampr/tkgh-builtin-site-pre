import { AuthShell } from "@/components/auth/AuthShell";
import { UnifiedAuthForm } from "@/components/auth/UnifiedAuthForm";
import { authOptions } from "@/lib/auth/options";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user) redirect(`/${locale}/account`);
  const tAuth = await getTranslations({ locale, namespace: "Auth" });

  return (
    <AuthShell
      title={tAuth("loginTitle")}
      subtitle={tAuth("loginSubtitle") || "Access your dashboard and services."}
      footer={(
        <div className="text-xs space-y-3">
          <p className="leading-relaxed">
            {tAuth("noAccount") || "Need an account?"}{" "}
            <Link href={`/${locale}/register`} className="font-semibold text-btn text-primary">
              {tAuth("registerUser") || "Register as User"}
            </Link>
          </p>
          <p className="leading-relaxed">
            {tAuth("becomeProvider") || "Offer services?"}{" "}
            <Link href={`/${locale}/register/provider`} className="font-semibold text-btn text-primary">
              {tAuth("registerProvider") || "Register as Provider"}
            </Link>
          </p>
        </div>
      )}
    >
      <UnifiedAuthForm mode="login" />
    </AuthShell>
  );
}
