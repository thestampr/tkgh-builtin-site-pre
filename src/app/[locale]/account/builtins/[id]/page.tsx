import BuiltInEditor from '@/components/provider/BuiltInEditor';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function BuiltInEditPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
    const { locale, id } = await params;
    
    noStore();
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect(`/${locale}/login`);
    if (session.user.role !== 'PROVIDER') redirect(`/${locale}/account`);
    const item = await prisma.builtIn.findUnique({ where: { id: id } });
    if (!item) redirect(`/${locale}/account/builtins`);
    return <BuiltInEditor initialItem={item} locale={locale} />;
}
