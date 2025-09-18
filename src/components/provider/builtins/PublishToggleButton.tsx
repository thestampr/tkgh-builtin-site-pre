"use client";
import React from 'react';

interface PublishToggleButtonProps {
  status: string;
  loading: boolean;
  onClick: () => void;
  t: (k: string) => string;
  className?: string;
}

export const PublishToggleButton: React.FC<PublishToggleButtonProps> = ({ status, loading, onClick, t, className = '' }) => {
  const isPub = status === 'PUBLISHED';
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-2 py-0.5 rounded border text-[11px] transition disabled:opacity-50 ${isPub ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'} ${className}`}
      title={isPub ? t('publish.unpublish') : t('publish.publish')}
    >
      {loading ? (isPub ? t('publish.unpublishing') : t('publish.publishing')) : (isPub ? t('publish.published') : t('publish.draft'))}
    </button>
  );
};
