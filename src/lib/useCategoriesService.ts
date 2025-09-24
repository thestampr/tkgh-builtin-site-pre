"use client";
import { useCallback, useState } from "react";
import type { Category, CategoryTranslation } from "@prisma/client";
import type { CategoryDto } from "@/components/provider/categories/types";

type SortKind = 'updated_desc' | 'name_asc' | 'name_desc' | 'created_desc' | 'created_asc';
type PublishedFilter = 'ALL' | 'true' | 'false';

type ListParams = {
  search?: string;
  published?: PublishedFilter;
  sort?: SortKind;
  signal?: AbortSignal;
};

type CreateInput = Pick<Category, 'name' | 'slug'> & Partial<Pick<Category, 'published' | 'coverImage' | 'excerpt' | 'description'>>;
type UpdateInput = Partial<Pick<Category, 'name' | 'published' | 'coverImage' | 'excerpt' | 'description'>>;
type TranslationInput = Pick<CategoryTranslation, 'name' | 'excerpt' | 'description' | 'published'>;

type ServiceState = { loading: boolean; error: string | null };

export function useCategoriesService() {
  const [state, setState] = useState<ServiceState>({ loading: false, error: null });

  const wrap = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setState({ loading: true, error: null });
    try { return await fn(); }
    catch (e: unknown) { const msg = e instanceof Error ? e.message : 'Error'; setState({ loading: false, error: msg }); throw e; }
    finally { setState(s => ({ ...s, loading: false })); }
  }, []);

  const list = useCallback((params: ListParams): Promise<{ categories: CategoryDto[] }> =>
    wrap(async () => {
      const res = await fetch('/api/provider/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', search: params.search, published: params.published, sort: params.sort }),
        signal: params.signal,
      });
      if (!res.ok) throw new Error('List failed');
      return (await res.json()) as { categories: CategoryDto[] };
    })
  , [wrap]);

  const detail = useCallback((id: string): Promise<{ category: CategoryDto } > =>
    wrap(async () => {
      const res = await fetch(`/api/provider/categories/${id}`);
      if (!res.ok) throw new Error('Detail failed');
      return (await res.json()) as { category: CategoryDto };
    })
  , [wrap]);

  const create = useCallback((input: CreateInput): Promise<{ category: CategoryDto }> =>
    wrap(async () => {
      const res = await fetch('/api/provider/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      if (!res.ok) throw new Error('Create failed');
      return (await res.json()) as { category: CategoryDto };
    })
  , [wrap]);

  const update = useCallback((id: string, patch: UpdateInput): Promise<{ category: CategoryDto }> =>
    wrap(async () => {
      const res = await fetch(`/api/provider/categories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      if (!res.ok) throw new Error('Update failed');
      return (await res.json()) as { category: CategoryDto };
    })
  , [wrap]);

  const upsertTranslation = useCallback((id: string, locale: string, translation: TranslationInput): Promise<{ category: CategoryDto }> =>
    wrap(async () => {
      const res = await fetch(`/api/provider/categories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ translationLocale: locale, translation }) });
      if (!res.ok) throw new Error('Translation save failed');
      return (await res.json()) as { category: CategoryDto };
    })
  , [wrap]);

  const remove = useCallback((id: string) => wrap(async () => {
    const res = await fetch(`/api/provider/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    return { ok: true } as const;
  }), [wrap]);

  const uploadCover = useCallback(async (file: File | null): Promise<string | null> => {
    if (!file) return null;
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/provider/categories/upload', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Upload failed');
    const j = await res.json();
    return (j.url as string) || null;
  }, []);

  return { list, detail, create, update, upsertTranslation, remove, uploadCover, state };
}
