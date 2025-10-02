import CategoriesManager from "@/components/provider/categories/CategoriesManager";
import type { CategoryDto } from "@/components/provider/categories/types";
import { defaultLocale } from "@/i18n/navigation";
import { getProviderCategories } from "@/lib/api";
import { authOptions } from "@/lib/auth/options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CategoriesManagerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== "PROVIDER") redirect(`/${locale}/account`);

  const providerId = session.user.id;
  const cats = await getProviderCategories(providerId) as CategoryDto[];
  const categories = cats.map(c => ({ 
    ...c,
    languages: Array.from(new Set([defaultLocale, ...(c.translations?.map(t => {
      if (t.published) return t.locale;
      else return `${t.locale}*`;
    }) || [])])).join(", ") || defaultLocale
  }));

  return <CategoriesManager initialCategories={categories} />;
}
