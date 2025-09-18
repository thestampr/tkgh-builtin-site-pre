import { AuthShell } from '@/components/auth/AuthShell';
import { UnifiedAuthForm } from '@/components/auth/UnifiedAuthForm';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProviderRegisterPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Auth' });
    const session = await getServerSession(authOptions);
    if (session?.user) redirect(`/${locale}/account`);
    return (
        <AuthShell
            title={t('providerRegisterTitle') || 'Provider Registration'}
            subtitle={t('providerRegisterSubtitle') || 'Create a provider account to manage content & services.'}
            tone="provider"
            footer={(
                <div className="space-y-4">
                    <p className="text-[11px] leading-relaxed">
                        {t('alreadyHaveAccount') || 'Already have an account?'}{' '}
                        <Link href={`/${locale}/login`} className="font-semibold text-[#755b36] hover:text-[#5c4528] underline underline-offset-4 decoration-dotted">
                            {t('loginLink') || 'Login here'}
                        </Link>
                    </p>
                    <p className="text-[11px] leading-relaxed">
                        {t('wantNormalAccount') || 'Need a regular user account?'}{' '}
                        <Link href={`/${locale}/register`} className="font-semibold text-[#755b36] hover:text-[#5c4528] underline underline-offset-4 decoration-dotted">
                            {t('registerUser') || 'Register as User'}
                        </Link>
                    </p>
                    <p className="text-[10px] text-[#6b5433]/70 leading-relaxed">
                        {t('providerDisclaimer') || 'Provider accounts may be subject to review.'}
                    </p>
                </div>
            )}
        >
            <UnifiedAuthForm mode="register" fixedRole="PROVIDER" showRoleSelector={false} hideModeToggle />
        </AuthShell>
    );
}
