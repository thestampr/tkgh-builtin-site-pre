import { BuiltInGrid } from "@/components/BuiltInGrid";
import SearchFilterBar from "@/components/SearchFilterBar";
import { queryBuiltIns, queryCategories, type BuiltInQueryParams } from "@/lib/api";
import ProviderButton from "@/src/components/ProviderButton";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale, namespace: "BuiltIn" });
  return {
    title: t("title"),
    description: t("desc")
  };
}

export default async function BuiltInIndexPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string, providerId: string }>,
  searchParams?: Promise<{ [k: string]: string | string[] | undefined }>
}) {
  const [{ locale, providerId }, sp] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "BuiltIn" });

  const search = typeof sp?.q === "string" ? sp.q : undefined;
  const order = typeof sp?.order === "string" ? sp.order : undefined;
  const category = typeof sp?.cat === "string" ? sp.cat : undefined;
  const min = typeof sp?.min === "string" ? Number(sp.min) : undefined;
  const max = typeof sp?.max === "string" ? Number(sp.max) : undefined;
  const query: BuiltInQueryParams = {
    search,
    order,
    category,
    minPrice: typeof min === "number" && !isNaN(min) ? min : undefined,
    maxPrice: typeof max === "number" && !isNaN(max) ? max : undefined
  }

  const [items, categories] = await Promise.all([
    queryBuiltIns({ providerId, ...query, locale }),
    queryCategories({ providerId, locale })
  ]);

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-7xl px-6 lg:px-12 xl:px-20 py-10 md:py-16">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            {categories.length > 0 && categories[0].provider && <>
              <ProviderButton provider={categories[0].provider} />
              <span className="font-medium mx-2">/</span>
            </>}
            {t("listTitle")}
          </h1>
          <p className="mt-2 text-slate-600">{t("listSubtitle")}</p>
        </div>

        <SearchFilterBar variant="builtins" inline categories={categories.map(c => ({ slug: c.slug, title: c.title }))} />
        {items?.length ? (
          <BuiltInGrid items={items} showProvider={false} />
        ) : (
          <div className="rounded-xl border bg-white p-8 text-center text-slate-600">
            {search || category || min || max ? (t("emptySearch") || "No built-ins match your filters.") : t("empty")}
          </div>
        )}
      </section>
    </main>
  );
}