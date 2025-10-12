"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface PublishToggleButtonProps {
  status: boolean;
  onClick?: () => void | Promise<void>;
  className?: string;
  disabled?: boolean;
}

export const PublishToggleButton: React.FC<PublishToggleButtonProps> = ({ status, onClick, className = "", disabled }) => {
  const [loading, setLoading] = useState(false);
  const t = useTranslations("PublishState");

  const handleClick = async () => {
    if (loading || disabled) return;
    setLoading(true);
    await onClick?.();
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || disabled}
      className={clsx(
        "btn btn-ghost btn-xs",
        status 
          ? "btn-accent !bg-accent/10 !border-accent/20" 
          : "!bg-neutral-50 !border-neutral-200 !text-neutral-600",
        className
      )}
      title={status ? t("unpublish") : t("publish")}
    >
      {loading ? (status ? t("unpublishing") : t("publishing")) : (status ? t("published") : t("draft"))}
    </button>
  );
};
