"use client"

import ResponsiveSwiper from "@/components/responsive-swiper";
import type { BuiltInItem } from "@/lib/api";
import { formatPrice } from "@/lib/formatting";
import clsx from "clsx";
import { type Session } from "next-auth";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SwiperSlide } from "swiper/react";
import { CategoryButton } from "./CategoryButton";
import { FavoriteButton } from "./FavoriteButton";
import ProviderButton from "./ProviderButton";

type TypeKind = "search" | "category" | "provider" | `category-${string}` | `provider-${string}`;

/**
 * Props for BuiltInGrid and BuiltInSwiper components
 *
 * @param items - The list of built-in items to display
 */
interface Props {
  items: BuiltInItem[];
}

/**
 * Props for Swiper component
 *
 * @param items - The list of built-in items to display
 * @param className - Additional CSS classes for the swiper container
 */
interface SwiperProps {
  items: BuiltInItem[];
  className?: string;
}

/**
 * Props for BuiltInGrid component
 * 
 * @param showCategory - Whether to show the category information
 * @param showProvider - Whether to show the provider information
 * @param type - The type of the component (category or provider) for placeholder messages
 */
interface BuiltInGridProps {
  showCategory?: boolean;
  showProvider?: boolean;
  type?: TypeKind;
};

/**
 * Props for individual BuiltInCard component
 * 
 * @param session - The current user session
 * @param item - The built-in item data to display
 */
interface BuiltInItemProps {
  session?: Session | null;
  item: BuiltInItem;
};

function Placeholder({ type }: { type?: TypeKind }) {
  const t = useTranslations("BuiltIn");
  const tCat = useTranslations("Categories");
  
  const message = () => {
    switch (type) {
      case "search":
        return t("emptySearch");
      case "category":
        return tCat("noItems");
      case "provider":
        return t("providerNoItems");
      default:
        return t("emptyDesc");
    }
  }

  const categoryName = type?.startsWith("category-") ? type.replace("category-", "") : undefined;
  if (categoryName) {
    return <div className="rounded-xl border border-divider bg-white p-8 text-center text-slate-600">
      <strong>{categoryName}</strong> — {tCat("noItems")}
    </div>
  }

  const providerName = type?.startsWith("provider-") ? type.replace("provider-", "") : undefined;
  if (providerName) {
    return <div className="rounded-xl border border-divider bg-white p-8 text-center text-slate-600">
      <strong>{providerName}</strong> — {t("providerNoItems")}
    </div>
  }

  return (
    <div className="rounded-xl border border-divider p-10 text-center bg-white/60">
      <h3 className="text-base font-semibold text-slate-700">{t("empty")}</h3>
      <p className="mt-2 text-sm text-slate-500">{message()}</p>
    </div>
  )
}

export function BuiltInCard(props: BuiltInItemProps & BuiltInGridProps) {
  const { session, item, showCategory, showProvider } = props;
  const { title, price, currency, image, provider, category } = item;
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
        "group rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm shadow-sm overflow-hidden cursor-pointer",
        "hover:shadow-lg hover:border-primary/40 transition-all duration-500"
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
        <div className="flex items-center justify-between">
          <h3 className="line-clamp-1 text-base md:text-lg font-semibold text-slate-900 group-hover:text-[#8a6a40] transition-colors">
            {title}
          </h3>
          <span className="text-slate-600 text-sm">
            {formatPrice(price ?? null, locale, currency)}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
          {showProvider && item.provider &&
            <span className="max-w-[60%] truncate">
              <ProviderButton provider={item.provider} size="sm" ghost />
            </span>
          }
          {showCategory && category &&
            <CategoryButton category={{...category, provider}} /> // ensure provider is passed for correct link
          }
        </div>
      </div>
    </div>
  );
}

export function BuiltInGrid(props: Props & BuiltInGridProps) {
  const { items, showCategory = true, showProvider = true, type } = props;

  if (!items?.length) {
    return <Placeholder type={type} />;
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
  const { items, className, showCategory = true, showProvider = true, type } = props;

  if (!items?.length) {
    return (
      <div className={className}>
        <Placeholder type={type} />
      </div>
    );
  }

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