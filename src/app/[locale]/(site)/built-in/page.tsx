import { BuiltInGrid } from "@/components/BuiltInGrid";
import { queryBuiltIns, queryCategories } from "@/lib/api";
import { getTranslations } from "next-intl/server";
import SearchFilterBar from "@/components/SearchFilterBar";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale, namespace: "BuiltIn" });
  return {
    title: t("title"),
    description: t("desc")
  };
}

export default async function BuiltInIndexPage({ params, searchParams }: { params: Promise<{ locale: string }>, searchParams?: Promise<{ [k: string]: string | string[] | undefined }> }) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "BuiltIn" });
  const search = typeof sp?.q === "string" ? sp.q : undefined;
  const order = typeof sp?.order === "string" ? sp.order : undefined;
  const cat = typeof sp?.cat === "string" ? sp.cat : undefined;
  const min = typeof sp?.min === "string" ? Number(sp.min) : undefined;
  const max = typeof sp?.max === "string" ? Number(sp.max) : undefined;
  const items = await queryBuiltIns({ search, order, category: cat, minPrice: typeof min === "number" && !isNaN(min) ? min : undefined, maxPrice: typeof max === "number" && !isNaN(max) ? max : undefined, locale });
  const categories = await queryCategories({ locale });

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-7xl px-6 lg:px-12 xl:px-20 py-10 md:py-16">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">{t("listTitle")}</h1>
          <p className="mt-2 text-slate-600">{t("listSubtitle")}</p>
        </div>

        <SearchFilterBar variant="builtins" inline categories={categories.map(c => ({ slug: c.slug, title: c.title }))} />
        {items?.length ? (
          <BuiltInGrid items={items} />
        ) : (
          <div className="rounded-xl border bg-white p-8 text-center text-slate-600">
            {search || cat || min || max ? (t("emptySearch") || "No built-ins match your filters.") : t("empty")}
          </div>
        )}
      </section>
    </main>
  );
}