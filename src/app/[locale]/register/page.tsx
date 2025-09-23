import { AuthShell } from "@/components/auth/AuthShell";
import { UnifiedAuthForm } from "@/components/auth/UnifiedAuthForm";
import { authOptions } from "@/lib/auth/options";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user) redirect(`/${locale}/account`);
  const tAuth = await getTranslations({ locale, namespace: "Auth" });

  return (
    <AuthShell
      title={tAuth("registerTitle") || "Create Account"}
      subtitle={tAuth("registerSubtitle") || "Join to access personalized features."}
      tone="register"
      footer={(
        <div className="space-y-4">
          <p className="text-[11px] leading-relaxed">
            {tAuth("alreadyHaveAccount") || "Already have an account?"}{" "}
            <Link href={`/${locale}/login`} className="font-semibold text-primary hover:underline underline-offset-4">
              {tAuth("loginLink") || "Login here"}
            </Link>
          </p>
          <p className="text-[11px] leading-relaxed">
            {tAuth("providerCtaPrompt") || "Want to offer services?"}{" "}
            <Link href={`/${locale}/register/provider`} className="font-semibold text-primary hover:underline underline-offset-4">
              {tAuth("providerCta") || "Register as Provider"}
            </Link>
          </p>
        </div>
      )}
    >
      <UnifiedAuthForm mode="register" />
    </AuthShell>
  );
}
