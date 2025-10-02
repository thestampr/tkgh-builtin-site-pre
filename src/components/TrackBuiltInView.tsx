"use client";

import { useEffect } from 'react';

// Used for analytics to track views of built-in items
export function TrackBuiltInView({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return;
    fetch('/api/builtin-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug })
    }).catch(()=>{});
  }, [slug]);
  return null;
}
