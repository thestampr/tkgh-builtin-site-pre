"use client"

import ResponsiveSwiper from "@/components/responsive-swiper";
import type { BuiltInItem } from "@/lib/api";
import { formatPrice } from "@/lib/formatting";
import clsx from "clsx";
import { type Session } from "next-auth";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SwiperSlide } from "swiper/react";
import { FavoriteButton } from "./FavoriteButton";
import ProviderButton from "./ProviderButton";

interface Props {
  items: BuiltInItem[];
}

interface SwiperProps {
  items: BuiltInItem[];
  className?: string;
}

interface BuiltInGridProps {
  showCategory?: boolean;
  showProvider?: boolean;
};

interface BuiltInItemProps {
  session?: Session | null;
  item: BuiltInItem;
};

export function BuiltInCard(props: BuiltInItemProps & BuiltInGridProps) {
  const { session, item, showCategory, showProvider } = props;
  const { title, price, currency, image, provider } = item;
  const locale = useLocale();
  const router = useRouter();

  const providerId = provider?.id;
  const builtInHref = providerId
    ? `/${locale}/p/${providerId}/built-in/${item.slug || item.id}`
    : `/${locale}/built-in/${item.slug || item.id}`;

  const favorited = session?.user
    ? item.favorites && item.favorites.some(f => f.userId === session.user.id)
    : false;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(builtInHref);
  }

  return (
    <div 
      className={clsx(
        "group rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm shadow-sm overflow-hidden transition-all duration-500 cursor-pointer",
        "hover:shadow-lg hover:border-primary/40"
      )}
      onClick={handleClick}
    >
      <div className="relative w-full aspect-video shrink-0 bg-slate-100 overflow-hidden">
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt || title || "Built-in Item"}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div
            className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-100"
            aria-hidden="true"
          />
        )}
        {session?.user && (
          <div className="absolute top-2 right-2">
            <FavoriteButton builtInId={item.id} initial={favorited} iconButton />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 text-base md:text-lg font-semibold text-slate-900 group-hover:text-[#8a6a40] transition-colors">
          {title}
        </h3>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-slate-600 font-medium">
            {formatPrice(price ?? null, locale, currency)}
          </span>
          {showProvider && item.provider &&
            <span className="max-w-24 truncate">
              <ProviderButton provider={item.provider} size="sm" ghost />
            </span>
          }
        </div>
      </div>
    </div>
  );
}

export function BuiltInGrid(props?: Props & BuiltInGridProps) {
  const { items, showCategory = false, showProvider = true } = props || {};

  if (!items?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center bg-gradient-to-br from-white/80 to-slate-50/60">
        <h3 className="text-base font-semibold text-slate-700">ยังไม่มีรายการ Built-in</h3>
        <p className="mt-2 text-sm text-slate-500">ระบบยังไม่มีข้อมูล Built-in ให้แสดง</p>
      </div>
    );
  }

  const { data: session } = useSession();

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) =>
        <BuiltInCard
          key={item.id}
          item={item}
          session={session}
          showCategory={showCategory}
          showProvider={showProvider}
        />
      )}
    </div>
  );
}

export function BuiltInSwiper(props: SwiperProps & BuiltInGridProps) {
  const { items, className, showCategory = false, showProvider = true } = props || {};

  if (!items?.length) return null;

  const { data: session } = useSession();

  return (
    <ResponsiveSwiper maxSlidePerView={3} className={className}>
      {items.map((item) => (
        <SwiperSlide key={item.id}>
          <BuiltInCard
            key={item.id}
            item={item}
            session={session}
            showCategory={showCategory}
            showProvider={showProvider}
          />
        </SwiperSlide>
      ))}
    </ResponsiveSwiper>
  );
}