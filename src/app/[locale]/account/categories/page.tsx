import CategoriesManager from '@/components/provider/CategoriesManager';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CategoriesManagerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== 'PROVIDER') redirect(`/${locale}/account`);
  const userId = session.user.id;
  // Direct DB query avoids losing auth cookies with an internal fetch and is faster.
  const cats = await prisma.category.findMany({ where: { providerId: userId }, orderBy: { createdAt: 'desc' } });
  const ids = cats.map(c => c.id);
  let translations: any[] = [];
  if (ids.length && prisma.categoryTranslation?.findMany) {
    translations = await prisma.categoryTranslation.findMany({ where: { categoryId: { in: ids }, published: true }, select: { categoryId: true, locale: true } });
  }
  const grouped = translations.reduce((acc: Record<string, string[]>, t: any) => { (acc[t.categoryId] ||= []).push(t.locale); return acc; }, {});
  const base = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'th';
  const categories = cats.map(c => ({ ...c, languages: [base, ...(grouped[c.id] || [])].join(', ') }));
  return <CategoriesManager initialCategories={categories} />;
}
