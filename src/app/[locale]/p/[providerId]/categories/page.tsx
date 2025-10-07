import { CategoryGrid } from "@/components/CategoryGrid";
import ProviderButton from "@/components/ProviderButton";
import SearchFilterBar from "@/components/SearchFilterBar";
import { getProviderInfo, queryCategories, type CategoryQueryParams } from "@/lib/api";
import clsx from "clsx";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale, namespace: "Categories" });
  return {
    title: t("title"),
    description: t("desc")
  };
}

export default async function CategoriesIndexPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string, providerId: string }>,
  searchParams?: Promise<{ [k: string]: string | string[] | undefined }>
}) {
  const [{ locale, providerId }, sp] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "Categories" });

  const search = typeof sp?.q === "string" ? sp.q : undefined;
  const order = typeof sp?.order === "string" ? sp.order : undefined;
  const query: CategoryQueryParams = {
    search,
    order
  }

  const [categories, provider] = await Promise.all([
    queryCategories({ providerId, ...query, locale }),
    getProviderInfo(providerId)
  ]);

  const noMatch = provider?._count?.categories && (search || order);

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-7xl px-6 lg:px-12 xl:px-20 py-10 md:py-16">
        <div className="mb-8">
          <h1 className={clsx(
            "text-2xl md:text-3xl font-bold flex items-center gap-2",
            "*:!text-2xl md:*:!text-3xl"
          )}>
            {provider && <>
              <ProviderButton provider={provider} size="md" />
              <span className="font-medium mx-2">/</span>
            </>}
            {t("listTitle")}
          </h1>
          <p className="mt-2 text-slate-600">{t("listSubtitle")}</p>
        </div>

        <SearchFilterBar variant="categories" inline />
        <CategoryGrid categories={categories} showProvider={false} type={noMatch ? "search" : provider ? `provider-${provider.displayName}` : undefined} />
      </section>
    </main>
  );
}