"use client";
import { useCallback, useState } from 'react';
import type { BuiltIn, BuiltInTranslation, BuiltInStatus } from '@prisma/client';

type BuiltInListParams = {
  search?: string;
  status?: BuiltInStatus | 'ALL';
  categoryId?: string;
  sort?: 'updated_desc' | 'title_asc' | 'title_desc' | 'views_desc' | 'favorites_desc';
};
type BuiltInListParamsInternal = BuiltInListParams & { signal?: AbortSignal };

type SaveBuiltInInput = Pick<BuiltIn, 'title' | 'slug' | 'price' | 'currency' | 'categoryId' | 'content'> & {
  gallery: string[];
};

type TranslationUpsertInput = Pick<BuiltInTranslation, 'title' | 'content' | 'price' | 'currency' | 'published'>;

type BuiltInDto = BuiltIn & {
  languages: string;
  favoritesCount: number;
  gallery: string[];
  translations?: BuiltInTranslation[];
};

type ApiBuiltIn = BuiltIn & {
  languages?: string | null;
  favoritesCount?: number | null;
  galleryJson?: string | null;
  translations?: BuiltInTranslation[];
};

type CreateResult = { item: BuiltInDto };
type UpdateResult = { item: BuiltInDto };
type ListResult = { items: BuiltInDto[] };
type DetailResult = { item: BuiltInDto };

interface ServiceState {
  loading: boolean;
  error: string | null;
}

export function useBuiltInsService() {
  const [state, setState] = useState<ServiceState>({ loading: false, error: null });

  const wrap = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setState({ loading: true, error: null });
    try {
      return await fn();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error';
      setState({ loading: false, error: message });
      throw e;
    } finally {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  const baseLocale = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'th').toString();

  const parseGallery = (json: string | null | undefined): string[] => {
    if (!json) return [];
    try {
      const arr = JSON.parse(json);
      return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  };

  const mapBuiltIn = (i: ApiBuiltIn): BuiltInDto => {
    return {
      ...i,
      languages: (i.languages || baseLocale).toString(),
      favoritesCount: typeof i.favoritesCount === 'number' ? i.favoritesCount : 0,
      gallery: parseGallery(i.galleryJson),
      translations: i.translations,
    } as BuiltInDto;
  };

  const list = useCallback((params: BuiltInListParamsInternal): Promise<ListResult> => {
    return wrap(async () => {
      const res = await fetch(`/api/provider/builtins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', ...params }),
        signal: params.signal,
      });
      if (!res.ok) throw new Error('List failed');
      const data = (await res.json()) as { items: ApiBuiltIn[] };
      return { items: (data.items || []).map(mapBuiltIn) };
    });
  }, [wrap]);

  const detail = useCallback((id: string): Promise<DetailResult> =>
    wrap(async () => {
      const res = await fetch(`/api/provider/builtins/${id}`);
      if (!res.ok) throw new Error('Detail failed');
      const data = (await res.json()) as { item: ApiBuiltIn };
      return { item: mapBuiltIn(data.item) };
    }),
  [wrap]);

  const create = useCallback((input: SaveBuiltInInput): Promise<CreateResult> =>
    wrap(async () => {
      const res = await fetch('/api/provider/builtins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Create failed');
      const data = (await res.json()) as { item: ApiBuiltIn };
      return { item: mapBuiltIn(data.item) };
    }),
  [wrap]);

  const update = useCallback(
    (
      id: string,
      patch: Partial<SaveBuiltInInput> & { direct?: boolean; coverImage?: string | null }
    ): Promise<UpdateResult> =>
      wrap(async () => {
        const res = await fetch(`/api/provider/builtins/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error('Update failed');
        const data = (await res.json()) as { item: ApiBuiltIn };
        return { item: mapBuiltIn(data.item) };
      })
  , [wrap]);

  const upsertTranslation = useCallback(
    (
      id: string,
      locale: string,
      translation: TranslationUpsertInput
    ): Promise<UpdateResult> =>
      wrap(async () => {
        const res = await fetch(`/api/provider/builtins/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ translationLocale: locale, translation }),
        });
        if (!res.ok) throw new Error('Translation save failed');
        const data = (await res.json()) as { item: ApiBuiltIn };
        return { item: mapBuiltIn(data.item) };
      })
  , [wrap]);

  const publishToggle = useCallback(
    (id: string, published: boolean): Promise<UpdateResult> =>
      wrap(async () => {
        const res = await fetch(`/api/provider/builtins/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ published }),
        });
        if (!res.ok) throw new Error('Publish toggle failed');
        const data = (await res.json()) as { item: ApiBuiltIn };
        return { item: mapBuiltIn(data.item) };
      })
  , [wrap]);

  const remove = useCallback((id: string) => wrap(async () => {
    const res = await fetch(`/api/provider/builtins/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    return { ok: true } as const;
  }), [wrap]);

  const uploadImages = useCallback(async (files: FileList | null): Promise<string[]> => {
    if (!files || !files.length) return [];
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('files', f));
    const res = await fetch('/api/provider/builtins/upload', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Upload failed');
    const j = await res.json();
    return j.urls as string[];
  }, []);

  return { list, detail, create, update, upsertTranslation, publishToggle, remove, uploadImages, state };
}
