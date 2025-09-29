import { BuiltInGrid } from "@/components/BuiltInGrid";
import Hero from "@/components/Hero";
import { getBuiltInItemsByProvider, getCategoryByProvider } from "@/lib/api";
import ProviderButton from "@/components/ProviderButton";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CategoryByProviderSlug({ params }: { params: Promise<{ locale: string; providerId: string; slug: string }> }) {
  const { locale, providerId, slug } = await params;

  const tCategories = await getTranslations({ locale, namespace: "Categories" });
  const tBuiltIn = await getTranslations({ locale, namespace: "BuiltIn" });

  const [category, items] = await Promise.all([
    getCategoryByProvider(providerId, slug, { locale }),
    getBuiltInItemsByProvider(providerId, { categorySlug: slug, locale })
  ]);

  if (!category) return notFound();

  return (
    <>
      {/* Hero cover */}
      <Hero
        title={category.title}
        subtitle={category.description ?? ""}
        extendBackground
      >
        <div className="h-[50vh] w-full relative">
          {category.image?.url ? (
            <Image
              src={category.image.url}
              alt={category.image.alt || category.title}
              className="object-cover bg-center"
              fill
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-100" aria-hidden="true" />
          )}
        </div>
      </Hero>

      {/* Items grid */}
      <section className="px-8 lg:px-18 xl:px-26 pt-8 py-32 min-h-fit">
        {category.provider && (
          <div className="mb-10 flex items-center gap-3 text-sm text-slate-600">
            <ProviderButton provider={category.provider} />
            <span className="text-slate-400">/</span>
            <span>{category.title}</span>
          </div>
        )}
        {items.length > 0 && (
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">{tBuiltIn("listTitle")}</h1>
            <p className="mt-2 text-slate-600">{tBuiltIn("listSubtitle")}</p>
          </div>
        )}
        <BuiltInGrid items={items} showProvider={false} showCategory={false} type={`category-${category.title}`} />
      </section>
    </>
  );
}
