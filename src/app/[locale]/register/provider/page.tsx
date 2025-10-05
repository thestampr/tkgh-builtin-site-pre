import { AuthShell } from '@/components/auth/AuthShell';
import { UnifiedAuthForm } from '@/components/auth/UnifiedAuthForm';
import { authOptions } from '@/lib/auth/options';
import { getServerSession } from 'next-auth';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProviderRegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user) redirect(`/${locale}/account`);
  const t = await getTranslations({ locale, namespace: 'Auth' });

  return (
    <AuthShell
      title={t('providerRegisterTitle') || 'Provider Registration'}
      subtitle={t('providerRegisterSubtitle') || 'Create a provider account to manage content & services.'}
      tone="provider"
      footer={(
        <div className="text-xs space-y-3">
          <p className="leading-relaxed">
            {t('alreadyHaveAccount') || 'Already have an account?'}{' '}
            <Link href={`/${locale}/login`} className="font-semibold text-btn text-primary">
              {t('loginLink') || 'Login here'}
            </Link>
          </p>
          <p className="leading-relaxed">
            {t('wantNormalAccount') || 'Need a regular user account?'}{' '}
            <Link href={`/${locale}/register`} className="font-semibold text-btn text-primary">
              {t('registerUser') || 'Register as User'}
            </Link>
          </p>
          <br />
          <p className="text-[10px] text-[#6b5433]/70 leading-relaxed">
            {t('providerDisclaimer') || 'Provider accounts may be subject to review.'}
          </p>
        </div>
      )}
    >
      <UnifiedAuthForm mode="register" role="PROVIDER" />
    </AuthShell>
  );
}
