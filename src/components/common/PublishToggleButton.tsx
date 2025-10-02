"use client";

import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import React from 'react';

interface PublishToggleButtonProps {
  status: string;
  loading: boolean;
  onClick: () => void;
  className?: string;
}

export const PublishToggleButton: React.FC<PublishToggleButtonProps> = ({ status, loading, onClick, className = '' }) => {
  const t = useTranslations("ProviderBuiltIns");

  const isPub = status === 'PUBLISHED';
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={clsx(
        "px-2 py-0.5 rounded border text-[11px] transition disabled:opacity-50 cursor-pointer",
        isPub 
          ? "bg-accent/10 border-accent/20 text-accent hover:bg-accent/20" 
          : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-200",
        className
      )}
      title={isPub ? t('publish.unpublish') : t('publish.publish')}
    >
      {loading ? (isPub ? t('publish.unpublishing') : t('publish.publishing')) : (isPub ? t('publish.published') : t('publish.draft'))}
    </button>
  );
};
