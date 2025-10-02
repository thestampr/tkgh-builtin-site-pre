"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import React from "react";

interface PublishToggleButtonProps {
  status: boolean;
  onClick: () => void | Promise<void>;
  className?: string;
}

export const PublishToggleButton: React.FC<PublishToggleButtonProps> = ({ status, onClick, className = "" }) => {
  const [loading, setLoading] = React.useState(false);
  const t = useTranslations("ProviderBuiltIns");

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    await onClick();
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={clsx(
        "px-2 py-0.5 rounded border text-[11px] transition disabled:opacity-50 cursor-pointer",
        status 
          ? "bg-accent/10 border-accent/20 text-accent hover:bg-accent/20" 
          : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-200",
        className
      )}
      title={status ? t("publish.unpublish") : t("publish.publish")}
    >
      {loading ? (status ? t("publish.unpublishing") : t("publish.publishing")) : (status ? t("publish.published") : t("publish.draft"))}
    </button>
  );
};
