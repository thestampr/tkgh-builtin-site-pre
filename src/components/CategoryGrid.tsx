"use client"

import ResponsiveSwiper from "@/components/responsive-swiper";
import type { Category } from "@/lib/api";
import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SwiperSlide } from "swiper/react";
import ProviderButton from "./ProviderButton";

type TypeKind = "search" | "provider" | `provider-${string}`;

/**
 * Props for CategoryGrid and CategorySwiper components
 *
 * @param categories - The list of categories to display
 * @param showProvider - Whether to show the provider information
 * @param type - The type of the component (search or provider) for placeholder messages
 */
interface Props {
  categories: Category[];
  showProvider?: boolean;
  type?: TypeKind;
}

/**
 * Props for Swiper component
 *
 * @param className - Additional CSS classes for the swiper container
 */
interface SwiperProps {
  className?: string;
}

/**
 * Props for individual CategoryCard component
 *
 * @param category - The category data to display
 * @param showProvider - Whether to show the provider information
 */
type CategoryItemProps = {
  category: Category;
  showProvider?: boolean;
};

function Placeholder({ type }: { type?: TypeKind }) {
  const t = useTranslations("Categories");

  const message = () => {
    switch (type) {
      case "search":
        return t("emptySearch");
      case "provider":
        return t("providerNoCategories");
      default:
        return t("emptyDesc");
    }
  }

  const providerName = type?.startsWith("provider-") ? type.replace("provider-", "") : undefined;
  if (providerName) {
    return <div className="rounded-xl border border-divider bg-white p-8 text-center text-slate-600">
      <strong>{providerName}</strong> — {t("providerNoCategories")}
    </div>
  }
  
  return (
    <div className="rounded-xl border border-divider p-10 text-center bg-white/60">
      <h3 className="text-base font-semibold text-slate-700">{t("empty")}</h3>
      <p className="mt-2 text-sm text-slate-500">{message()}</p>
    </div>
  )
}

export function CategoryCard(props: CategoryItemProps) {
  const { category, showProvider = true } = props;
  const { title, slug, description, excerpt, image, provider } = category;
  const locale = useLocale();
  const router = useRouter();

  const providerId = provider?.id;
  const categoryHref = providerId
    ? `/${locale}/p/${providerId}/categories/${slug}`
    : `/${locale}/categories/${slug}`;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(categoryHref);
  }

  return (
    <div
      className={clsx(
        "group rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm shadow-sm overflow-hidden cursor-pointer",
        "hover:shadow-lg hover:border-primary/40 transition-all duration-500"
      )}
      onClick={handleClick}
    >
      <div className="relative w-full aspect-video shrink-0 bg-slate-100 overflow-hidden">
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt || title || "Category"}
            fill
            className={clsx(
              "object-cover group-hover:scale-105 brightness-85 group-hover:brightness-100",
              "transition-all duration-500 ease-in-out"
            )}
          />
        ) : (
          <div
            className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-100"
            aria-hidden="true"
          />
        )}
      </div>
      <div className="min-w-0 p-4">
        <h3 className="truncate text-base md:text-lg font-semibold text-slate-900 group-hover:text-[#8a6a40] transition-colors">
          {title}
        </h3>
        {excerpt || description ? (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600/90">
            {excerpt || description}
          </p>
        ) : null}
        <div className="mt-3">
          {showProvider && provider &&
            <div className="mt-3 max-w-24 truncate">
              <ProviderButton provider={provider} size="sm" ghost />
            </div>
          }
        </div>
      </div>
    </div>
  );
}

export function CategoryGrid(props: Props) {
  const { categories, showProvider, type } = props;

  if (!categories?.length) {
    return <Placeholder type={type} />;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat) =>
        <CategoryCard
          key={cat.id}
          category={cat}
          showProvider={showProvider}
        />
      )}
    </div>
  );
}

export function CategorySwiper(props: SwiperProps & Props) {
  const { categories, className, showProvider, type } = props;

  if (!categories?.length) {
    return (
      <div className={className}>
        <Placeholder type={type} />
      </div>
    );
  }

  return (
    <ResponsiveSwiper maxSlidePerView={3} className={className}>
      {categories.map((cat) => (
        <SwiperSlide key={cat.id}>
          <CategoryCard
            key={cat.id}
            category={cat}
            showProvider={showProvider}
          />
        </SwiperSlide>
      ))}
    </ResponsiveSwiper>
  );
}