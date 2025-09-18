import { AuthShell } from '@/components/auth/AuthShell';
import { UnifiedAuthForm } from '@/components/auth/UnifiedAuthForm';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Auth' });
    const session = await getServerSession(authOptions);
    if (session?.user) redirect(`/${locale}/account`);
    return (
        <AuthShell
            title={t('registerTitle') || 'Create Account'}
            subtitle={t('registerSubtitle') || 'Join to access personalized features.'}
            tone="register"
            footer={(
                <div className="space-y-4">
                    <p className="text-[11px] leading-relaxed">
                        {t('alreadyHaveAccount') || 'Already have an account?'}{' '}
                        <Link href={`/${locale}/login`} className="font-semibold text-[#755b36] hover:text-[#5c4528] underline underline-offset-4 decoration-dotted">
                            {t('loginLink') || 'Login here'}
                        </Link>
                    </p>
                    <p className="text-[11px] leading-relaxed">
                        {t('providerCtaPrompt') || 'Want to offer services?'}{' '}
                        <Link href={`/${locale}/register/provider`} className="font-semibold text-[#755b36] hover:text-[#5c4528] underline underline-offset-4 decoration-dotted">
                            {t('providerCta') || 'Register as Provider'}
                        </Link>
                    </p>
                </div>
            )}
        >
            <UnifiedAuthForm mode="register" hideModeToggle showRoleSelector={false} />
        </AuthShell>
    );
}
