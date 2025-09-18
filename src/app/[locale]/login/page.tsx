import { AuthShell } from '@/components/auth/AuthShell';
import { UnifiedAuthForm } from '@/components/auth/UnifiedAuthForm';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Auth' });
    const session = await getServerSession(authOptions);
    if (session?.user) {
        redirect(`/${locale}/account`);
    }
    return (
        <AuthShell
            title={t('loginTitle')}
            subtitle={t('loginSubtitle') || 'Access your dashboard and services.'}
            footer={(
                <div className="space-y-3">
                    <p className="leading-relaxed">
                        {t('noAccount') || 'Need an account?'}{' '}
                        <Link href={`/${locale}/register`} className="font-semibold text-[#7a603c] hover:text-[#5c4528] underline underline-offset-4 decoration-dotted">
                            {t('registerUser') || 'Register as User'}
                        </Link>
                    </p>
                    <p className="leading-relaxed">
                        {t('becomeProvider') || 'Offer services?'}{' '}
                        <Link href={`/${locale}/register/provider`} className="font-semibold text-[#7a603c] hover:text-[#5c4528] underline underline-offset-4 decoration-dotted">
                            {t('registerProvider') || 'Register as Provider'}
                        </Link>
                    </p>
                </div>
            )}
        >
            <UnifiedAuthForm mode="login" hideModeToggle />
        </AuthShell>
    );
}
