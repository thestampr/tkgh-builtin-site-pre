import type { Category, CategoryTranslation } from "@prisma/client";

export type CategoryDto = Category & {
  languages?: string;
  translations?: CategoryTranslation[];
};

export interface DraftShape {
  name: string;
  slug: string;
  published: boolean;
  coverImage: string | null;
  excerpt: string | null;
  description: string | null;
}

export interface TranslationDraft {
  name?: string;
  excerpt?: string | null;
  description?: string | null;
  published?: boolean;
}

export type SortKind =
  | "updated_desc"
  | "name_asc"
  | "name_desc"
  | "created_desc"
  | "created_asc";
