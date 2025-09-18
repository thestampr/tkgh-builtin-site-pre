export interface BuiltInTranslation {
  id?: string;
  locale: string;
  title: string | null;
  content: string | null;
  price: number | null;
  currency: string | null;
  published?: boolean;
}

export interface BuiltInBase {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  currency: string | null;
  categoryId: string | null;
  content: string | null;
  coverImage: string | null;
  galleryJson?: string | null;
  gallery?: string[];
  status: 'PUBLISHED' | 'DRAFT';
  updatedAt: string;
  viewCount?: number;
  favoritesCount?: number;
  languages?: string; // comma separated or aggregated
  translations?: BuiltInTranslation[];
}

export type BuiltIn = BuiltInBase;

export interface Category {
  id: string;
  name: string;
}

export interface BuiltInListParams {
  search?: string;
  status?: string;
  categoryId?: string;
  sort?: string;
}

export interface SaveBuiltInInput {
  title: string;
  slug: string;
  price: number | null;
  currency: string | null;
  categoryId: string | null;
  content: string | null;
  gallery: string[];
}

export interface TranslationUpsertInput {
  title: string | null;
  content: string | null;
  price: number | null;
  currency: string | null;
  published: boolean;
}

export interface CreateResult { item: BuiltIn; }
export interface UpdateResult { item: BuiltIn; }
export interface ListResult { items: BuiltIn[]; }
export interface DetailResult { item: BuiltIn; }
