import type { BuiltIn, BuiltInTranslation } from "@prisma/client";
import type { JsonValue } from "@prisma/client/runtime/library";

export interface BuiltInDto extends BuiltIn {
  languages?: string | null;
  favoritesCount?: number | null;
  gallery?: string[] | null;
  galleryJson: JsonValue;
  translations?: BuiltInTranslation[];
  _count?: { 
    favorites: number;
  };
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