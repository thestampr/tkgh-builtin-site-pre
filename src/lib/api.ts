import type { CTAConfig } from "@/components/ProviderCTA";
import type {
  BuiltIn,
  Estimate,
  FavoriteBuiltIn,
  Profile,
  ProfileTranslation,
  User,
  Category as _C,
  CategoryTranslation as _CT
} from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "./db/prisma";

export interface ProviderInfo {
  id: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  _count?: {
    builtIns: number;
    categories: number;
  };
};

export interface Category {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  excerpt?: string | null;
  image?: { url: string; alt?: string | null } | null;
  providerId?: string;
  provider?: ProviderInfo | null;
  builtIns?: BuiltInItem[]; // if includeItems is true
};

export interface BuiltInItemCategory {
  id: string;
  title: string;
  slug: string
};

export interface BuiltInItem {
  id: string;
  title: string;
  slug: string;
  price?: number | null;
  currency?: string | null;
  description?: string | null;
  image?: { url: string; alt?: string | null } | null;
  images?: Array<{ url: string; alt?: string | null }>;
  category?: BuiltInItemCategory | null;
  content?: string | null;
  provider?: ProviderInfo | null;
  favorites?: FavoriteBuiltIn[]; // if user-specific
};

export interface ProviderPublicProfile {
  id: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverImage?: string | null;
  contacts?: {
    type: string;
    value: string
  }[] | null;
  cta?: CTAConfig | null;
}
export type OrderKind = "title_asc" | "title_desc" | "newest" | "price_low" | "price_high" | "popular";

// Helper types
type KeyValue = Record<string, unknown>;
interface CacheableParams { revalidate?: number, tags?: string[] }
interface LocaleParams { locale?: string }
interface ItemsQueryParams { includeItems?: boolean }

// Extended types
interface Provider extends User { 
  profile?: Profile | null 
};
interface CategoryBase extends _C { 
  translations?: _CT[], 
  provider: Provider | null,
  builtIns?: BuiltIn[]
};

const DEFAULT_LANG = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en";

// Basic mappers from Prisma models to public DTOs
function mapCategory(c: CategoryBase, locale?: string): Category {
  // Overlay translation if present and locale !== default (th)
  let title = c.name;
  let description = c.description;
  let excerpt = c.excerpt;
  if (locale && locale !== DEFAULT_LANG && c.translations) {
    const tr = c.translations.find((t) => t.locale === locale && t.published);
    if (tr) {
      if (tr.name) title = tr.name;
      if (tr.description) description = tr.description;
      if (tr.excerpt) excerpt = tr.excerpt;
    }
  }
  return {
    id: c.id,
    title,
    slug: c.slug,
    description,
    excerpt,
    image: c.coverImage ? { url: c.coverImage } : null,
    providerId: c.providerId,
    provider: c.provider ? {
      id: c.provider.id,
      displayName: c.provider.profile?.displayName || null,
      avatarUrl: c.provider.profile?.avatarUrl || null
    } : null,
    builtIns: c.builtIns ? c.builtIns.map((b) => mapBuiltIn(b, c, locale)) : undefined
  };
}

function mapBuiltIn(item: any, category?: any, locale?: string): BuiltInItem {
  const gallery: string[] = item.galleryJson ? safeJsonArray(item.galleryJson) : [];
  let title = item.title;
  let price = typeof item.price === "number" ? item.price : null;
  let currency: string | null = item.currency || null;
  let categoryObj = category || item.category;
  let categoryTitle = categoryObj?.name;
  if (locale && locale !== DEFAULT_LANG && item.translations) {
    const tr = item.translations.find((t: any) => t.locale === locale && t.published);
    if (tr) {
      if (tr.title) title = tr.title;
      if (typeof tr.price === "number") price = tr.price; // translation-specific price
      if (tr.currency) currency = tr.currency;
    }
  }
  // Category translation overlay
  if (locale && locale !== DEFAULT_LANG && categoryObj?.translations) {
    const ctr = categoryObj.translations.find((t: any) => t.locale === locale && t.published);
    if (ctr?.name) categoryTitle = ctr.name;
  }
  return {
    id: item.id,
    title,
    slug: item.slug,
    price: typeof price === "number" ? price / 100 : null,
    currency,
    image: item.coverImage ? { url: item.coverImage } : gallery[0] ? { url: gallery[0] } : undefined,
    category: categoryObj
      ? { id: categoryObj.id, title: categoryTitle, slug: categoryObj.slug }
      : null,
    provider: item.provider ? {
      id: item.provider.id,
      displayName:
        item.provider.profile?.displayName || null,
      avatarUrl: item.provider.profile?.avatarUrl || null
    } : null,
    favorites: item.favorites || [],
  };
}

function mapBuiltInDetail(item: any, category?: any, locale?: string): BuiltInItem {
  const gallery: string[] = item.galleryJson ? safeJsonArray(item.galleryJson) : [];
  let title = item.title;
  let summary = item.summary;
  let content = item.content;
  let price = typeof item.price === "number" ? item.price : null;
  let currency: string | null = item.currency || null;
  let categoryObj = category || item.category;
  let categoryTitle = categoryObj?.name;
  let favorites = item.favorites || [];
  if (locale && locale !== DEFAULT_LANG && item.translations) {
    const tr = item.translations.find((t: any) => t.locale === locale && t.published);
    if (tr) {
      if (tr.title) title = tr.title;
      if (tr.summary) summary = tr.summary;
      if (tr.content) content = tr.content;
      if (typeof tr.price === "number") price = tr.price;
      if (tr.currency) currency = tr.currency;
    }
  }
  if (locale && locale !== DEFAULT_LANG && categoryObj?.translations) {
    const ctr = categoryObj.translations.find((t: any) => t.locale === locale && t.published);
    if (ctr?.name) categoryTitle = ctr.name;
  }
  return {
    id: item.id,
    title,
    slug: item.slug,
    price: typeof price === "number" ? price / 100 : null,
    currency,
    description: summary,
    content,
    images: gallery.map((url) => ({ url })),
    favorites: favorites,
    category: categoryObj
      ? { id: categoryObj.id, title: categoryTitle, slug: categoryObj.slug }
      : null,
    provider: item.provider ? { id: item.provider.id, displayName: item.provider.profile?.displayName || null, avatarUrl: item.provider.profile?.avatarUrl || null } : null
  };
}

function safeJsonArray(v?: string | null): string[] {
  if (!v) return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

// Caching wrapper (opt-in revalidate seconds) - keyParts must include locale when data is locale-dependent
function cacheable<T extends (...args: any[]) => Promise<any>>(fn: T, keyParts: string[], revalidate?: number, tags?: string[]): T {
  if (revalidate === 0) return fn; // no cache
  return unstable_cache(fn, keyParts, { revalidate: revalidate ?? 30, tags });
}

/**
 * Get all published built-in items
 * @param params Arguments to filter built-in items (revalidate, locale)
 * @returns 
 */
export async function getBuiltInItems(
  params?: CacheableParams & LocaleParams
): Promise<BuiltInItem[]> {
  const { revalidate, locale = DEFAULT_LANG } = params || {};
  const run = cacheable(async () => {
    const items = await prisma.builtIn.findMany({
      where: {
        status: "PUBLISHED",
        category: {
          published: true
        }
      },
      include: {
        category: {
          include: {
            translations: true
          }
        },
        translations: true,
        provider: {
          include: {
            profile: true
          }
        },
      },
      orderBy: {
        title: "asc"
      }
    });
    return items.map((b) => mapBuiltIn(b, b.category, locale));
  }, ["builtins", locale], revalidate);
  return run();
}

/**
 * Get all categories
 * @param params Arguments to filter categories (revalidate, locale)
 * @returns 
 */
export async function getCategories(
  params: CacheableParams & LocaleParams
): Promise<Category[]> {
  const { revalidate, locale = DEFAULT_LANG } = params || {};
  const run = cacheable(async () => {
    const categories = await prisma.category.findMany({
      orderBy: {
        createdAt: "asc"
      },
      include: {
        translations: true,
        provider: {
          include: {
            profile: true
          }
        }
      }
    });
    return categories.map((c) => mapCategory(c, locale));
  }, ["categories", locale], revalidate);
  return run();
}

/**
 * Get user favorites
 * @param userId User ID
 * @param params Arguments to filter favorites (limit, revalidate, locale)
 */
export async function getUserFavorites(
  userId: string,
  params?: {
    limit?: number
  } & CacheableParams & LocaleParams
): Promise<BuiltInItem[]> {
  const { limit, revalidate, locale = DEFAULT_LANG } = params || {};
  const run = cacheable(async () => {
    const favorites = await prisma.favoriteBuiltIn.findMany({
      where: {
        userId
      },
      include: {
        builtIn: {
          include: {
            translations: true,
            provider: {
              include: {
                profile: true
              }
            },
            category: {
              include: {
                translations: true
              }
            }
          },
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    });
    return favorites.map((f) => f.builtIn.status === "PUBLISHED"
      ? mapBuiltInDetail(f.builtIn, f.builtIn.category, locale)
      : null)
      .filter((b): b is BuiltInItem => b !== null);
  }, ["userFavorites", userId, locale], revalidate, ["user"]);
  return run();
}

/**
 * Get a built-in item by provider ID and slug
 * @param providerId Provider ID
 * @param slug Built-in slug
 * @param params Arguments to filter built-in item (userId for favorites, revalidate, locale)
 */
export async function getBuiltInItem(
  providerId: string,
  slug: string,
  params?: {
    userId?: string
  } & CacheableParams & LocaleParams
): Promise<BuiltInItem | null> {
  const { revalidate, userId, locale = DEFAULT_LANG } = params || {};
  const run = cacheable(async () => {
    const item = await prisma.builtIn.findFirst({
      where: {
        slug,
        providerId,
        status: "PUBLISHED"
      },
      include: {
        category: {
          include: {
            translations: true
          }
        },
        favorites: userId ? {
          where: { userId: userId }
        } : false,
        translations: true,
        provider: {
          include: {
            profile: true
          }
        }
      }
    });
    return item ? mapBuiltInDetail(item, item.category, locale) : null;
  }, ["builtin", providerId, slug, locale], revalidate, ["user"]);
  return run();
}

/**
 * Get built-in items of a provider (all or only published)
 * @param providerId Provider ID
 * @param categorySlug Category slug (optional)
 * @param params Additional parameters
 * 
 * @example
 * // Get all built-ins of provider
 * getBuiltInItemsByProvider("provider123");
 *
 * // Get all provider"s built-ins in a specific category
 * getBuiltInItemsByProvider("provider123", "category456");
 * 
 * // Get all built-ins including unpublished (for provider themselves)
 * getBuiltInItemsByProvider("provider123", { includeUnpublished: true });
 */
export async function getBuiltInItemsByProvider(
  providerId: string,
  params?: {
    categorySlug?: string,
    includeUnpublished?: boolean
  } & CacheableParams & LocaleParams
): Promise<BuiltInItem[]> {
  const { categorySlug, includeUnpublished, revalidate, locale = DEFAULT_LANG } = params || {};
  const run = cacheable(async () => {
    let category = null;
    if (categorySlug) {
      category = await prisma.category.findFirst({
        where: {
          providerId,
          slug: categorySlug,
          published: includeUnpublished ? undefined : true
        },
        include: {
          translations: true,
          provider: {
            include: {
              profile: true
            }
          }
        }
      });
      if (!category) return [];
    }

    const items = await prisma.builtIn.findMany({
      where: {
        providerId,
        categoryId: categorySlug ? category!.id : undefined,
        status: includeUnpublished ? undefined : "PUBLISHED",
        category: {
          published: includeUnpublished ? undefined : true
        }
      },
      include: {
        category: {
          include: {
            translations: true,
            provider: {
              include: {
                profile: true
              }
            }
          }
        },
        translations: true,
        provider: {
          include: {
            profile: true
          }
        },
        favorites: true
      },
      orderBy: {
        title: "asc"
      }
    });
    return items.map((b) => mapBuiltIn(b, category, locale));
  }, ["builtins:cat:provider", providerId, categorySlug || "", locale], revalidate, ["user"]);
  return run();
}

/**
 * Get a category of a provider by slug
 * @param providerId Provider ID
 * @param categorySlug Category slug
 * @param params Additional parameters
 */
export async function getCategoryByProvider(
  providerId: string,
  categorySlug: string,
  params?: CacheableParams & LocaleParams & ItemsQueryParams
): Promise<Category | null> {
  const { revalidate, locale = DEFAULT_LANG, includeItems } = params || {};
  const run = cacheable(async () => {
    const category = await prisma.category.findFirst({
      where: {
        slug: categorySlug,
        providerId,
        published: true
      },
      include: {
        translations: true,
        provider: {
          include: {
            profile: true
          }
        },
        builtIns: includeItems ? {
          include: {
            provider: {
              select: {
                id: true,
              }
            },
            category: {
              select: {
                slug: true,
              }
            }
          }
        }: undefined
      }
    });
    return category ? mapCategory(category, locale) : null;
  }, ["category", providerId, categorySlug, locale], revalidate);
  return run();
}

/**
 * Get all categories owned by a provider
 * @param providerId Provider ID
 * @param params Aguments to filter categories
 */
export async function getCategoriesByProvider(
  providerId: string,
  params?: {
    includeUnpublished?: boolean
  } & CacheableParams & LocaleParams
): Promise<Category[]> {
  const { includeUnpublished, revalidate, locale = DEFAULT_LANG } = params || {};
  const run = cacheable(async () => {
    const cats = await prisma.category.findMany({
      where: {
        providerId,
        published: includeUnpublished ? undefined : true
      },
      orderBy: {
        name: "asc"
      },
      include: {
        translations: true,
        provider: {
          include: {
            profile: true
          }
        }
      }
    });
    return cats.map(c => mapCategory(c, locale));
  }, ["categories:provider", providerId, locale, includeUnpublished ? "all" : "pub"], revalidate);
  return run();
}

// Popular content (simple heuristics)
export async function getPopularBuiltIns(limit = 12, locale: string = DEFAULT_LANG): Promise<BuiltInItem[]> {
  const items = await prisma.builtIn.findMany({
    where: {
      status: "PUBLISHED",
      category: {
        published: true
      }
    },
    include: {
      category: {
        include: {
          translations: true
        }
      },
      translations: true,
      provider: {
        include: {
          profile: true
        }
      },
      favorites: true,
      _count: {
        select: {
          favorites: true
        }
      }
    }
  });
  const scored = items.map(b => ({
    raw: b,
    score: (b.viewCount || 0) + ((b._count?.favorites || 0) * 5)
  })).sort((a, b) => b.score - a.score).slice(0, limit);
  return scored.map(s => mapBuiltIn(s.raw, s.raw.category, locale));
}
export async function getPopularCategories(limit = 12, locale: string = DEFAULT_LANG): Promise<Category[]> {
  const categories = await prisma.category.findMany({
    where: {
      published: true
    },
    include: {
      translations: true,
      provider: {
        include: {
          profile: true
        }
      },
      builtIns: {
        where: {
          status: "PUBLISHED"
        },
        include: {
          _count: {
            select: {
              favorites: true
            }
          }
        }
      }
    }
  });
  const withScore = categories.map(c => {
    let viewSum = 0;
    let favSum = 0;
    for (const b of c.builtIns) {
      viewSum += (b.viewCount || 0);
      favSum += (b._count?.favorites || 0);
    }
    const score = viewSum + favSum * 5;
    return { raw: c, score };
  }).filter(c => c.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
  return withScore.map(c => mapCategory(c.raw, locale));
}

// Search & filter helpers
export interface CategoryQueryParams {
  search?: string;
  providerId?: string;
  order?: "name_asc" | "name_desc" | "popular" | string;
}
export async function queryCategories(params: CategoryQueryParams & LocaleParams): Promise<Category[]> {
  const { search, providerId, order, locale = DEFAULT_LANG } = params;
  const where: KeyValue = { providerId, published: true };
  if (search) where.name = { contains: search, mode: "insensitive" };
  // basic ordering
  let orderBy: any = { name: "asc" };
  switch (order) {
    case "name_asc":
      orderBy = { name: "asc" };
      break;
    case "name_desc":
      orderBy = { name: "desc" };
      break;
  }
  // popularity - fallback: number of builtIns (client sort if needed)
  let categories = await prisma.category.findMany({
    where,
    include: {
      builtIns: {
        where: {
          status: "PUBLISHED",
          providerId: providerId || undefined
        },
      },
      translations: true,
      provider: {
        include: {
          profile: true
        }
      }
    },
    orderBy
  });

  if (order === "popular") {
    categories = categories.sort((a, b) => {
      const av = (a.builtIns).reduce((s: number, x) => s + x.viewCount, 0);
      const bv = (b.builtIns).reduce((s: number, x) => s + x.viewCount, 0);
      return bv - av;
    });
  }
  return categories.map(c => mapCategory(c, locale));
}
export interface BuiltInQueryParams {
  search?: string;
  order?: OrderKind | string;
  providerId?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}
export async function queryBuiltIns(params: BuiltInQueryParams & LocaleParams): Promise<BuiltInItem[]> {
  const { search, order, providerId, category, minPrice, maxPrice, locale = DEFAULT_LANG } = params;
  const where: KeyValue = { 
    providerId,
    status: "PUBLISHED" ,
    category: { published: true }
  };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { summary: { contains: search, mode: "insensitive" } }
    ];
  }
  if (category) {
    where.category = { slug: category };
  }
  if (typeof minPrice === "number") where.price = { ...(where.price || {}), gte: Math.round(minPrice * 100) };
  if (typeof maxPrice === "number") where.price = { ...(where.price || {}), lte: Math.round(maxPrice * 100) };
  // ordering
  let orderBy: { [key: string]: "asc" | "desc" } = { title: "asc" };
  switch (order) {
    case "title_asc":
      orderBy = { title: "asc" };
      break;
    case "title_desc":
      orderBy = { title: "desc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "price_low":
      orderBy = { price: "asc" };
      break;
    case "price_high":
      orderBy = { price: "desc" };
      break;
    case "popular":
      orderBy = { viewCount: "desc" };
      break;
  }
  if (providerId) {
    where.providerId = providerId;
  }
  const items = await prisma.builtIn.findMany({
    where,
    include: {
      category: {
        include: {
          translations: true
        }
      },
      translations: true,
      provider: {
        include: {
          profile: true
        }
      },
      favorites: true
    },
    orderBy,
    take: 120
  });
  return items.map(b => mapBuiltIn(b, b.category, locale));
}

// legacy fetcher
export async function fetchBuiltIns(providerId: string): Promise<BuiltIn[]> {
  try {
    return await prisma.builtIn.findMany({ 
      where: { 
        providerId,
        status: "PUBLISHED",
        category: { published: true }
      }, 
      include: { 
        translations: true, 
        favorites: true }, 
        orderBy: { 
          updatedAt: "desc" 
        } 
      }
    );
  } catch (e) {
    console.error("Failed to load built-ins", e);
    return [];
  }
}
export async function fetchCategories(providerId: string): Promise<_C[]> {
  try {
    return await prisma.category.findMany({ 
      where: { 
        providerId, 
        published: true 
      }, 
      orderBy: { 
        name: "asc" 
      } 
    });
  } catch (e) {
    console.error("Failed to load categories", e);
    return [];
  }
}

// User profile and provider public profile
export async function getProfile(userId: string): Promise<(Profile & { translations: ProfileTranslation[] }) | null> {
  return prisma.profile.findUnique({
    where: { userId },
    include: {
      translations: true
    }
  });
}

export async function getProviderInfo(userId: string): Promise<ProviderInfo | null> {
  const provider = await prisma.user.findUnique({
    where: { id: userId },
    include: { 
      profile: {
        select: {
          displayName: true,
          avatarUrl: true
        }
      },
      _count: {
        select: {
          builtIns: true,
          categories: true
        }
      }
    }
  });

  if (!provider?.profile) return null;
  return {
    id: userId,
    displayName: provider.profile.displayName,
    avatarUrl: provider.profile.avatarUrl,
    _count: provider._count
  };
}

export async function getProviderPublicProfile(providerId: string, locale: string = DEFAULT_LANG): Promise<ProviderPublicProfile | null> {
  const profile = await prisma.profile.findUnique({
    where: {
      userId: providerId
    },
    include: {
      translations: true
    }
  });
  if (!profile) return null;

  let contacts = null;
  try {
    contacts = JSON.parse(profile.contactJson?.toString() || "{}").channels || null;
  } catch { /* ignored */ }
  let displayName = profile.displayName;
  let bio = profile.bio;
  let ctaBase: any = null;
  try {
    ctaBase = JSON.parse(profile.ctaJson?.toString() || "{}");
  } catch { /* ignored */ }
  if (locale !== DEFAULT_LANG && profile.translations) {
    const tr = profile.translations.find((t) => t.locale === locale);
    if (tr) {
      if (tr.displayName) displayName = tr.displayName;
      if (tr.bio) bio = tr.bio;
      if (ctaBase && (tr.ctaLabel !== undefined)) ctaBase.label = tr.ctaLabel || ctaBase.label;
    }
  }
  return {
    id: providerId,
    displayName,
    bio,
    avatarUrl: profile.avatarUrl,
    coverImage: profile.coverImage || null,
    contacts,
    cta: ctaBase || null
  };
}

export async function getProviderCategories(providerId: string, locale: string = DEFAULT_LANG): Promise<_C[]> {
  const categories = await prisma.category.findMany({
    where: {
      providerId,
    },
    include: {
      translations: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  if (categories.length === 0) return [];
  if (locale === DEFAULT_LANG) return categories;

  return categories.map(c => {
    const tr = c.translations.find(t => t.locale === locale && t.published);
    return {
      ...c,
      name: tr?.name || c.name,
      excerpt: tr?.excerpt || c.excerpt,
      description: tr?.description || c.description
    };
  });
}

export async function getProviderBuiltIns(providerId: string, locale: string = DEFAULT_LANG): Promise<BuiltIn[]> {
  const builtIns = await prisma.builtIn.findMany({
    where: {
      providerId,
    },
    include: {
      translations: true,
      category: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  if (builtIns.length === 0) return [];
  if (locale === DEFAULT_LANG) return builtIns;

  return builtIns.map(it => {
    const tr = it.translations.find(t => t.locale === locale && t.published);
    return {
      ...it,
      title: tr?.title || it.title,
      content: tr?.content || it.content,
      price: tr?.price || it.price,
      currency: tr?.currency || it.currency
    };
  });
}

export interface CreateFormSubmissionInput {
  locale?: string;
  name: string;
  phone: string;
  email?: string;
  location?: string;
  category?: string;
  budget?: string;
  detail: string;
  userId?: string; // optional if authenticated
  providerId?: string; // target provider if any
};
export async function createFormSubmission(input: CreateFormSubmissionInput) {
  return prisma.estimate.create({
    data: {
      locale: input.locale || null,
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      location: input.location || null,
      category: input.category || null,
      budget: input.budget || null,
      detail: input.detail,
      userId: input.userId || null,
      // providerId is recently added; cast to satisfy types until prisma client regenerates
      ...(input.providerId ? { providerId: input.providerId } as any : {})
    }
  });
}

export async function getProviderFormSubmissions(providerId: string, locale: string = DEFAULT_LANG): Promise<Estimate[]> {
  const estimates = await prisma.estimate.findMany({
    where: {
      providerId
    },
    include: {
      category: {
        include: {
          translations: true
        }
      },
      user: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              displayName: true,
              avatarUrl: true,
              translations: {
                select: {
                  locale: true,
                  displayName: true
                }
              }
            }
          },
        },
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  if (estimates.length === 0) return [];
  if (locale === DEFAULT_LANG) return estimates;

  return estimates.map(row => ({
    ...row,
    category: row.category ? {
      ...row.category,
      name: row.category.translations.find(t => t.locale === locale)?.name || row.category.name
    } : null,
    user: row.user ? {
      ...row.user,
      profile: {
        ...row.user.profile,
        displayName: row.user.profile?.translations.find(t => t.locale === locale)?.displayName || row.user.profile?.displayName
      }
    } : null
  }));
}
