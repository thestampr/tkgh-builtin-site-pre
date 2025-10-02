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
  const userId = session.user.id;

  const cats = await getProviderCategories(userId, defaultLocale) as CategoryDto[];
  let languages: string[] = [defaultLocale];
  cats.forEach(c => {
    c.translations?.forEach(t => {
      if (!languages.includes(t.locale)) languages.push(t.locale);
    });
  });
  languages = Array.from(new Set(languages)); // ensure uniqueness
  const categories = cats.map(c => ({ ...c, languages: languages.join(", ") }));
  
  return <CategoriesManager initialCategories={categories} />;
}
