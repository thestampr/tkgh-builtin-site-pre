import { CategorySwiper } from "@/components/CategoryGrid";
import Hero from "@/components/Hero";
import { getBuiltInItems, getCategories, getPopularBuiltIns, getPopularCategories } from "@/lib/api";
import { BuiltInSwiper } from "@/components/BuiltInGrid";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

// Force dynamic rendering to ensure server-side fetching and locale switching
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale, namespace: "Home" });
  return {
    title: t("title"),
    description: t("desc")
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tHome = await getTranslations({ locale: locale, namespace: "Home" });
  const tCommon = await getTranslations({ locale: locale, namespace: "Common" });
  const tCategories = await getTranslations({ locale: locale, namespace: "Categories" });
  const tBuiltIn = await getTranslations({ locale: locale, namespace: "BuiltIn" });

  // Fetch all categories & built-ins plus popularity data
  const [allCategories, allBuiltIns, popularCategories, popularBuiltIns] = await Promise.all([
    getCategories({locale}),
    getBuiltInItems({locale}),
    getPopularCategories(100, locale),
    getPopularBuiltIns(100, locale)
  ]);

  // Re-order: ensure items with highest popularity score appear first while preserving others' relative order
  const popularCatIds = new Set(popularCategories.map(c => c.id));
  const categories = [
    ...popularCategories,
    ...allCategories.filter(c => !popularCatIds.has(c.id))
  ];
  const popularBuiltIds = new Set(popularBuiltIns.map(b => b.id));
  const builtIn = [
    ...popularBuiltIns,
    ...allBuiltIns.filter(b => !popularBuiltIds.has(b.id))
  ];

  return (
    <main>
      <Hero
        extendBackground
        title={tHome("heroTitle")}
        subtitle={tHome("heroSubtitle")}
        cta={
          <Link href={`/${locale}/estimate`} className="inline-flex items-center gap-2 mt-6 rounded bg-primary text-white px-6 py-3">
            {tCommon("freeEstimate")} <ChevronRight size={18} />
          </Link>
        }
      >
        <div className="h-screen bg-[url('/images/hero.jpg')] bg-cover bg-center" />
      </Hero>

      {/* Categories & Built-in Section */}
      <section className="py-12 min-h-screen">
        <div className="mb-2 md:mb-4 px-8 lg:px-18 xl:px-26 inline-flex items-baseline justify-between w-full">
          <h2 className="text-2xl font-semibold">
            {tCategories("title")}
          </h2>
          <Link href={`/${locale}/categories`} className="text-sm text-primary hover:underline">
            {tCommon("exploreMore")}
          </Link>
        </div>
        <CategorySwiper categories={categories} className="px-8 lg:px-18 xl:px-26" />

        <br />

        <div className="mb-2 md:mb-4 px-8 lg:px-18 xl:px-26 inline-flex items-baseline justify-between w-full">
          <h2 className="text-2xl font-semibold">
            {tBuiltIn("title")}
          </h2>
          <Link href={`/${locale}/built-in`} className="text-sm text-primary hover:underline">
            {tCommon("exploreMore")}
          </Link>
        </div>
        <BuiltInSwiper items={builtIn} className="px-8 lg:px-18 xl:px-26" />
      </section>
    </main>
  );
}