"use client";

import clsx from "clsx";
import React from "react";

interface LocaleTabsProps {
  locales: string[];
  active: string;
  onChange: (loc: string) => void;
  className?: string;
}

export const LocaleTabs: React.FC<LocaleTabsProps> = ({ locales, active, onChange, className = "" }) => {
  return (
    <div className={`flex gap-2 text-xs ${className}`}>
      {locales.map(loc => (
        <button
          key={loc}
          onClick={() => onChange(loc)}
          className={clsx(
            "btn btn-sm",
            active === loc ? "btn-secondary" : "btn-ghost"
          )}
        >{loc}</button>
      ))}
    </div>
  );
};
