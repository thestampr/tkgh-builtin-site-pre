"use client";
import { useCallback, useState } from 'react';
import type { BuiltIn, BuiltInListParams, CreateResult, UpdateResult, ListResult, DetailResult, SaveBuiltInInput, TranslationUpsertInput } from '@/types/builtins';

interface ServiceState {
  loading: boolean;
  error: string | null;
}

export function useBuiltInsService() {
  const [state, setState] = useState<ServiceState>({ loading: false, error: null });

  const wrap = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setState({ loading: true, error: null });
    try { return await fn(); } catch (e: any) { setState({ loading: false, error: e?.message || 'Error' }); throw e; } finally { setState(s => ({ ...s, loading: false })); }
  }, []);

  const list = useCallback((params: BuiltInListParams): Promise<ListResult> => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.status) qs.set('status', params.status);
    if (params.categoryId) qs.set('categoryId', params.categoryId);
    if (params.sort) qs.set('sort', params.sort);
    return wrap(async () => {
      const res = await fetch(`/api/provider/builtins?${qs.toString()}`);
      if (!res.ok) throw new Error('List failed');
      return res.json();
    });
  }, [wrap]);

  const detail = useCallback((id: string): Promise<DetailResult> => wrap(async () => {
    const res = await fetch(`/api/provider/builtins/${id}`);
    if (!res.ok) throw new Error('Detail failed');
    return res.json();
  }), [wrap]);

  const create = useCallback((input: SaveBuiltInInput): Promise<CreateResult> => wrap(async () => {
    const res = await fetch('/api/provider/builtins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    if (!res.ok) throw new Error('Create failed');
    return res.json();
  }), [wrap]);

  const update = useCallback((id: string, patch: Partial<SaveBuiltInInput> & { direct?: boolean; coverImage?: string | null }): Promise<UpdateResult> => wrap(async () => {
    const res = await fetch(`/api/provider/builtins/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    if (!res.ok) throw new Error('Update failed');
    return res.json();
  }), [wrap]);

  const upsertTranslation = useCallback((id: string, locale: string, translation: TranslationUpsertInput): Promise<UpdateResult> => wrap(async () => {
    const res = await fetch(`/api/provider/builtins/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ translationLocale: locale, translation }) });
    if (!res.ok) throw new Error('Translation save failed');
    return res.json();
  }), [wrap]);

  const publishToggle = useCallback((id: string, action: 'publish' | 'unpublish'): Promise<UpdateResult> => wrap(async () => {
    const res = await fetch(`/api/provider/builtins/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
    if (!res.ok) throw new Error('Publish toggle failed');
    return res.json();
  }), [wrap]);

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
