import { BuiltInSwiper } from "@/components/BuiltInGrid";
import { CategorySwiper } from "@/components/CategoryGrid";
import { getBuiltInItemsByProvider, getCategoriesByProvider, getProviderPublicProfile } from "@/lib/api";
import Hero from "@/components/Hero";
import { Link2, Mail, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProviderPublicPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;

  // IMPORTANT: pass locale so translated CTA label (ctaLabel) overlays correctly.
  const profile = await getProviderPublicProfile(providerId, locale);
  if (!profile) return notFound();

  const tCommon = await getTranslations({ locale, namespace: "Common" });
  const tBuiltIn = await getTranslations({ locale, namespace: "BuiltIn" });
  const tCategories = await getTranslations({ locale, namespace: "Categories" });

  // Fetch all published built-ins & categories then filter by provider id client-side for now (could add dedicated query later)
  const [categories, items] = await Promise.all([
    getCategoriesByProvider(providerId, { revalidate: 0, locale }),
    getBuiltInItemsByProvider(providerId, { revalidate: 0, locale })
  ]);

  const ContactIcon = ({ size, type }: { size?: number; type: string }) => {
    size ??= 14;
    switch (type.toLowerCase()) {
      case "link":
        return <Link2 size={size} />;
      case "email":
        return <Mail size={size} />;
      case "phone":
        return <Phone size={size} />;
      default:
        return <Link2 size={size} />;
    }
  }

  return (
    <>
      <div className="sticky top-0 w-full h-0 overflow-visible z-5">
        <div className="w-full py-4 h-fit px-8 lg:px-18 xl:px-26 bg-white shadow-b-sm flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative size-16 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-100 overflow-hidden border border-neutral-300 shrink-0">
              {profile.avatarUrl && (
                <Image src={profile.avatarUrl} alt={profile.displayName || "avatar"} fill className="object-cover" />
              )}
              {!profile.avatarUrl && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500">IMG</div>
              )}
            </div>
            <div className="space-y-2 w-full">
              <h1 className="text-3xl font-bold text-neutral-900 line-clamp-1">{profile.displayName || "Provider"}</h1>
              {profile.bio && <p className="text-neutral-600 max-w-2xl text-sm leading-relaxed">{profile.bio}</p>}
            </div>
          </div>
        </div>
      </div>

      <Hero extendBackground
        title={
          <div className="flex items-center gap-6 py-10 md:py-16 sticky top-0">
            <div className="relative size-24 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-100 overflow-hidden border border-neutral-300 shrink-0">
              {profile.avatarUrl && (
                <Image src={profile.avatarUrl} alt={profile.displayName || "avatar"} fill className="object-cover" />
              )}
              {!profile.avatarUrl && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500">IMG</div>
              )}
            </div>
            <div className="space-y-2 w-full">
              <h1 className="text-3xl font-bold text-white line-clamp-1">{profile.displayName || "Provider"}</h1>
              {profile.bio && <p className="text-neutral-400 max-w-2xl text-sm leading-relaxed">{profile.bio}</p>}
            </div>
          </div>
        }
      >
        <div className="h-[50vh] w-full relative overflow-hidden">
          {profile.coverImage ? (
            <Image
              src={profile.coverImage}
              alt="cover"
              className="object-cover bg-center"
              fill
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-100" aria-hidden="true" />
          )}
          {profile.contacts && profile.contacts.length > 0 && (
            <div className="absolute bottom-4 left-0 right-0 md:px-8 lg:px-18 xl:px-26 z-10 text-center md:text-left opacity-80">
              <div className="inline-flex overflow-x-auto gap-2">
                {profile.contacts.map((c, i) =>
                  <div key={i} className="flex items-center gap-2 px-4 py-2 text-white font-semibold text-nowrap">
                    <ContactIcon type={c.type} size={14} />
                    <span className="text-sm">{c.value}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Hero>

      <main className="bg-white pb-10 md:pb-16 relative">
        {/* Categories & Built-in Section */}
        <section className="py-12 min-h-screen">
          <div className="mb-2 md:mb-4 px-8 lg:px-18 xl:px-26 inline-flex items-baseline justify-between w-full">
            <h2 className="text-2xl font-semibold">
              {tCategories("title")}
            </h2>
            <Link href={`/${locale}/p/${providerId}/categories`} className="text-sm text-primary hover:underline">
              {tCommon("exploreMore")}
            </Link>
          </div>
          <CategorySwiper locale={locale} categories={categories} className="px-8 lg:px-18 xl:px-26" />

          <br />

          <div className="mb-2 md:mb-4 px-8 lg:px-18 xl:px-26 inline-flex items-baseline justify-between w-full">
            <h2 className="text-2xl font-semibold">
              {tBuiltIn("title")}
            </h2>
            <Link href={`/${locale}/p/${providerId}/built-in`} className="text-sm text-primary hover:underline">
              {tCommon("exploreMore")}
            </Link>
          </div>
          <BuiltInSwiper items={items} showProvider={false} className="px-8 lg:px-18 xl:px-26" />
        </section>
      </main>
    </>
  );
}
