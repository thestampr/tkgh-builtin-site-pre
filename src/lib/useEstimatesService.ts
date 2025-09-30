"use client";

import type { EstimateDto } from '@/components/provider/estimates/types';
import { useCallback, useState } from 'react';

interface ListResult {
  items: EstimateDto[];
}

interface MarkViewedResult {
  item: { id: string; viewed: boolean };
}

type BulkOperation = 'markViewed' | 'archive' | 'unarchive' | 'delete';

interface BulkResult {
  ok: boolean;
  operation: BulkOperation;
}

const ESTIMATES_ENDPOINT = '/api/provider/estimates';

// Generic JSON helper for POST requests
async function postJson<T>(
  url: string,
  body: unknown,
  init?: { signal?: AbortSignal }
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: init?.signal
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function useEstimatesService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === 'string') return err;
    return 'Error';
  };

  const wrap = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg);
      throw err; // rethrow for caller logic
    } finally {
      setLoading(false);
    }
  }, []);

  const list = useCallback(
    (signal?: AbortSignal): Promise<ListResult> =>
      wrap(async () => {
        return postJson<ListResult>(
          ESTIMATES_ENDPOINT,
          { action: 'list' },
          { signal }
        );
      }),
    [wrap]
  );

  const markViewed = useCallback(
    (id: string): Promise<MarkViewedResult> =>
      wrap(async () => {
        const res = await fetch(`${ESTIMATES_ENDPOINT}/${id}`, {
          method: 'PATCH'
        });
        if (!res.ok) {
          throw new Error('Update failed');
        }
        return res.json() as Promise<MarkViewedResult>;
      }),
    [wrap]
  );

  const bulk = useCallback(
    (operation: BulkOperation, ids: string[]): Promise<BulkResult> =>
      wrap(async () => {
        return postJson<BulkResult>(
          ESTIMATES_ENDPOINT,
          { action: 'bulk', operation, ids }
        );
      }),
    [wrap]
  );

  return {
    list,
    markViewed,
    bulk,
    state: { loading, error }
  };
}
