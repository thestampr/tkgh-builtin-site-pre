import CategoriesManager from '@/components/provider/categories/CategoriesManager';
import { defaultLocale } from '@/i18n/navigation';
import { getProviderCategories } from '@/lib/api';
import { authOptions } from '@/lib/auth/options';
import { Category, CategoryTranslation } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface CategoryWithTranslations extends Category {
  locale: string;
  translations?: CategoryTranslation[];
}

export default async function CategoriesManagerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== 'PROVIDER') redirect(`/${locale}/account`);
  const userId = session.user.id;

  const cats = await getProviderCategories(userId, defaultLocale) as CategoryWithTranslations[];
  let languages: string[] = [defaultLocale];
  cats.forEach(c => {
    c.translations?.forEach(t => {
      if (!languages.includes(t.locale)) languages.push(t.locale);
    });
  });
  const categories = cats.map(c => ({ ...c, languages: languages.join(', ') }));
  return <CategoriesManager initialCategories={categories} />;
}
