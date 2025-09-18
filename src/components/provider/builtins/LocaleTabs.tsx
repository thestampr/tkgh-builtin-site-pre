"use client";
import React from 'react';

interface LocaleTabsProps {
  locales: string[];
  active: string;
  onChange: (loc: string) => void;
  className?: string;
}

export const LocaleTabs: React.FC<LocaleTabsProps> = ({ locales, active, onChange, className = '' }) => {
  return (
    <div className={`flex gap-2 text-xs ${className}`}>
      {locales.map(loc => (
        <button
          key={loc}
            onClick={() => onChange(loc)}
            className={`px-3 py-1 rounded border ${active === loc ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-300 text-neutral-600 bg-white'}`}
        >{loc}</button>
      ))}
    </div>
  );
};
