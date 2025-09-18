import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { redirect } from 'next/navigation';
import BuiltInsManager from '../../../../components/provider/BuiltInsManager';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Direct DB fetch to ensure reliable data (avoids cookie forwarding issues on reload)
async function fetchBuiltInsDirect(providerId: string) {
  try {
    return await prisma.builtIn.findMany({ where: { providerId }, include: { translations: true, favorites: true }, orderBy: { updatedAt: 'desc' } });
  } catch (e) {
    console.error('Failed to load built-ins', e);
    return [] as any[];
  }
}

async function fetchCategories(providerId: string) {
  try {
    return await prisma.category.findMany({ where: { providerId, published: true }, orderBy: { name: 'asc' } });
  } catch (e) {
    console.error('Failed to load categories', e);
    return [] as any[];
  }
}

export default async function BuiltInsManagerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== 'PROVIDER') redirect(`/${locale}/account`);
  const providerId = session.user.id;
  const [itemsRaw, categories] = await Promise.all([
    fetchBuiltInsDirect(providerId),
    fetchCategories(providerId)
  ]);
  const ids = itemsRaw.map(i => i.id);
  let translations: any[] = [];
  if (ids.length && prisma.builtInTranslation?.findMany) {
    translations = await prisma.builtInTranslation.findMany({ where: { builtInId: { in: ids }, published: true }, select: { builtInId: true, locale: true } });
  }
  const grouped = translations.reduce((acc: Record<string, string[]>, t: any) => { (acc[t.builtInId] ||= []).push(t.locale); return acc; }, {});
  const base = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'th';
  const items = itemsRaw.map(i => ({ ...i, languages: [base, ...(grouped[i.id] || [])].join(', ') }));
  return <BuiltInsManager initialItems={items} categories={categories} locale={locale} />;
}
