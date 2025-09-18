"use client"

import ResponsiveSwiper from "@/components/responsive-swiper";
import type { Category } from "@/lib/api";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { SwiperSlide } from "swiper/react";

type CategoryItemProps = {
  item: Category;
  locale: string;
};

export function CategoryTile({
  item,
  locale
}: CategoryItemProps) {
  const { title, description, excerpt, image } = item;
  const providerId = (item as any).providerId;
  const categoryHref = providerId ? `/${locale}/p/${providerId}/categories/${item.slug || item.id}` : `/${locale}/categories/${item.slug || item.id}`;
  return (
    <Link href={categoryHref}>
      <div className="group rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4 md:p-5 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200 bg-slate-100">
            {image?.url ? (
              <Image
                src={image.url}
                alt={image.alt || title || "Category"}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div
                className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-100"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base md:text-lg font-semibold text-slate-900 group-hover:text-[#8a6a40] transition-colors">
              {title}
            </h3>
            {excerpt || description ? (
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                {excerpt || description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CategoryCard({
  item,
  locale
}: CategoryItemProps) {
  const { title, description, excerpt, image, provider } = item;
  const providerId = provider?.id;
  const categoryHref = providerId 
    ? `/${locale}/p/${providerId}/categories/${item.slug || item.id}` 
    : `/${locale}/categories/${item.slug || item.id}`;
    
  return (
    <Link href={categoryHref}>
      <div className={clsx(
        "group rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm overflow-hidden",
        "shadow-sm hover:shadow-lg transition-all duration-500 hover:border-[#d5c2ad]"
      )}>
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
          <div className="mt-3 flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 border border-slate-300/70" aria-hidden="true" />
            <span className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors">Provider</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CategoryGrid({
  locale,
  categories
}: {
  locale: string;
  categories: Category[];
}) {
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
      {categories.map((cat) => <CategoryCard key={cat.id} item={cat} locale={locale} />)}
    </div>
  );
}

export function CategorySwiper({
  locale,
  categories,
  className,
}: {
  locale: string;
  categories: Category[];
  className?: string;
}) {
  if (!categories?.length) return null;

  return (
    <ResponsiveSwiper maxSlidePerView={3} className={className}>
      {categories.map((cat) => (
        <SwiperSlide key={cat.id}>
          <CategoryCard key={cat.id} item={cat} locale={locale} />
        </SwiperSlide>
      ))}
    </ResponsiveSwiper>
  );
}