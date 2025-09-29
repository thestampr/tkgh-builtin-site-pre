"use client"

import ResponsiveSwiper from "@/components/responsive-swiper";
import type { Category } from "@/lib/api";
import clsx from "clsx";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SwiperSlide } from "swiper/react";
import ProviderButton from "./ProviderButton";

interface Props {
  categories: Category[];
  showProvider?: boolean;
}

interface SwiperProps {
  className?: string;
}

type CategoryItemProps = {
  item: Category;
  showProvider?: boolean;
};

export function CategoryCard(props: CategoryItemProps) {
  const { item, showProvider = true } = props;
  const { title, slug, description, excerpt, image, provider } = item;
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
        "group rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm overflow-hidden cursor-pointer",
        "shadow-sm hover:shadow-lg transition-all duration-500 hover:border-[#d5c2ad]"
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
              "object-cover group-hover:scale-105 brightness-95 group-hover:brightness-100",
              "transition-transform duration-500 ease-in-out"
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
        {showProvider && provider &&
          <div className="mt-3 max-w-24 truncate">
            <ProviderButton provider={provider} size="sm" ghost />
          </div>
        }
      </div>
    </div>
  );
}

export function CategoryGrid(props: Props) {
  const { categories, showProvider } = props;

  if (!categories?.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center bg-white/60">
        <h3 className="text-base font-semibold text-slate-700">ยังไม่มีหมวดหมู่</h3>
        <p className="mt-2 text-sm text-slate-500">ระบบยังไม่มีข้อมูล Category ในตอนนี้</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat) =>
        <CategoryCard
          key={cat.id}
          item={cat}
          showProvider={showProvider}
        />
      )}
    </div>
  );
}

export function CategorySwiper(props: SwiperProps & Props) {
  const { categories, className, showProvider } = props;
  if (!categories?.length) return null;

  return (
    <ResponsiveSwiper maxSlidePerView={3} className={className}>
      {categories.map((cat) => (
        <SwiperSlide key={cat.id}>
          <CategoryCard key={cat.id} item={cat} showProvider={showProvider} />
        </SwiperSlide>
      ))}
    </ResponsiveSwiper>
  );
}