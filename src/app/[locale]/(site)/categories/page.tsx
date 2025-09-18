import { getTranslations } from "next-intl/server";
import { queryCategories } from "@/lib/api";
import { CategoryGrid } from "@/components/CategoryGrid";
import SearchFilterBar from '@/components/SearchFilterBar';

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale, namespace: "Categories" });
  return {
    title: t("title"),
    description: t("desc")
  };
}

export default async function CategoriesIndexPage({ params, searchParams }: { params: Promise<{ locale: string }>, searchParams?: Promise<{ [k: string]: string | string[] | undefined }> }) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "Categories" });
  const search = typeof sp?.q === 'string' ? sp.q : undefined;
  const order = typeof sp?.order === 'string' ? sp.order : undefined;
  const categories = await queryCategories({ search, order, locale });

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-7xl px-6 lg:px-12 xl:px-20 py-10 md:py-16">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">{t("listTitle")}</h1>
          <p className="mt-2 text-slate-600">{t("listSubtitle")}</p>
        </div>

        <SearchFilterBar variant="categories" inline />
        {categories?.length ? (
          <CategoryGrid locale={locale} categories={categories} />
        ) : (
          <div className="rounded-xl border bg-white p-8 text-center text-slate-600">
            {search ? (t('emptySearch') || 'No categories match your search.') : t('empty')}
          </div>
        )}
      </section>
    </main>
  );
}