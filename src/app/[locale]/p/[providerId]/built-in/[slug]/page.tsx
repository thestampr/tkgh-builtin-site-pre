import BackButton from "@/components/common/BackButton";
import { CategoryButton } from "@/components/CategoryButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import GallerySwiper from "@/components/common/GallerySwiper";
import ProviderButton from "@/components/ProviderButton";
import { TrackBuiltInView } from "@/components/TrackBuiltInView";
import { getBuiltInItem } from "@/lib/api";
import { authOptions } from "@/lib/auth/options";
import { formatPrice } from "@/lib/formatting";
import DOMPurify from "isomorphic-dompurify";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";

export const dynamic = "force-dynamic";

export default async function BuiltInByProviderSlug({ params }: { params: Promise<{ locale: string; providerId: string; slug: string }> }) {
  const { locale, providerId, slug } = await params;
  const session = await getServerSession(authOptions);
  const tCommon = await getTranslations({ locale, namespace: "Common" });
  const tBuiltIn = await getTranslations({ locale, namespace: "BuiltIn" });

  // URL decoding
  const decodedSlug = decodeURIComponent(slug);

  const item = await getBuiltInItem(providerId, decodedSlug, { userId: session?.user?.id, locale });
  if (!item) return notFound();

  const hero = item.images?.[0] || null;
  const hasGallery = item.images;

  const backHref = `/${locale}/p/${providerId}`;

  return (
    <main className="bg-white">
      <TrackBuiltInView slug={slug} />
      {/* Header / Hero */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 xl:px-20 py-6 md:py-10">
          <div className="flex items-center justify-between gap-3">
            <BackButton href={backHref} />
            <div className="text-sm text-slate-500">
              {item.category?.title ? item.category.title : ""}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="relative h-64 md:h-80 w-full">
              {hero?.url ? (
                <Image
                  src={hero.url}
                  alt={hero.alt || item.title}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority
                />
              ) : (
                <div
                  className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-100"
                  aria-hidden="true"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-sm">
                  {item.title}
                </h1>
                <div className="mt-2 text-white/90">
                  {formatPrice(item.price ?? null, locale, item.currency) || "-"}
                </div>
                {item.provider && (
                  <div className="mt-3 **:text-white/90 w-fit">
                    <ProviderButton provider={item.provider} size="md" padding={2} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section>
        <div className="mx-auto max-w-7xl px-6 lg:px-12 xl:px-20 py-10 md:py-16 grid gap-10 md:grid-cols-3">
          {/* Description */}
          <article className="md:col-span-2 space-y-4">
            {item.content ? (
              <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[remarkRehype]}>
                {DOMPurify.sanitize(item.content)}
              </Markdown>
            ) : (
              <div className="text-slate-600">{tBuiltIn("noContent")}</div>
            )}
          </article>

          {/* Summary card */}
          <aside className="md:col-span-1">
            <div className="rounded-2xl border bg-white shadow-sm p-6">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold text-slate-900">{tCommon("summary")}</h2>
                {/* Favorite button */}
                <FavoriteButton builtInId={item.id} initial={(item.favorites || []).length > 0} />
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-slate-600">{tCommon("price")}</dt>
                  <dd className="text-slate-900 font-medium">
                    {formatPrice(item.price ?? null, locale, item.currency) || "-"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-600">{tCommon("category")}</dt>
                  <dd className="text-slate-900">
                    <CategoryButton category={{ ...item.category!, provider: item.provider }} />
                  </dd>
                </div>
              </dl>

              <div className="mt-6">
                <Link
                  href={`/${locale}/estimate`}
                  className="btn btn-primary"
                >
                  {tCommon("freeEstimate")}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Gallery */}
      {hasGallery && (
        <section className="pb-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-12 xl:px-20">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">{tCommon("gallery")}</h2>
          </div>
          <GallerySwiper images={item.images?.map((img) => ({ url: img.url })) || []} className="mx-auto max-w-7xl px-6 lg:px-12 xl:px-20" />
        </section>
      )}
    </main>
  );
}
