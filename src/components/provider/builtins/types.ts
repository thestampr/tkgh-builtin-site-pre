import type { BuiltIn, BuiltInTranslation } from "@prisma/client";
import type { JsonValue } from "@prisma/client/runtime/library";

export type BuiltInDto = BuiltIn & {
  languages?: string | null;
  favoritesCount?: number | null;
  gallery?: string[] | null;
  galleryJson?: JsonValue;
};

export type InitialItem = BuiltIn & {
  languages?: string | null;
  favoritesCount?: number | null;
  galleryJson?: JsonValue;
  translations?: BuiltInTranslation[];
};

export interface TranslationDraft { 
  title?: string; 
  content?: string; 
  price?: number | null; 
  currency?: string | null; 
  published?: boolean; 
}

export interface DraftShape {
  title: string;
  slug: string;
  price: number | null;
  currency: string | null;
  categoryId: string | null;
  content: string | null;
  gallery: string[];
}

export type sortKind = "updated_desc" | "title_asc" | "title_desc" | "views_desc" | "favorites_desc";