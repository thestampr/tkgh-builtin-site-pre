"use client";

import React from "react";

interface ImageAvatarsProps {
  coverImage?: string | null;
  gallery?: string[] | null;
  max?: number;
  className?: string;
}

export const ImageAvatars: React.FC<ImageAvatarsProps> = ({ coverImage, gallery, max = 3, className = "" }) => {
  const raw = [coverImage, ...(gallery || [])].filter(Boolean) as string[];
  const dedup = raw.filter((src, idx) => idx === 0 || src !== raw[0]);
  const shown = dedup.slice(0, max);
  return (
    <div className={`flex -space-x-3 ${className}`}>
      {shown.map((src, i) => (
        <img key={i} src={src} className="h-8 w-8 rounded-full object-cover ring-2 ring-white border border-neutral-300" />
      ))}
      {dedup.length === 0 && (
        <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] text-neutral-500 border border-neutral-300">—</div>
      )}
      {dedup.length > max && (
        <div className="h-8 w-8 rounded-full bg-neutral-200 text-[10px] flex items-center justify-center ring-2 ring-white border border-neutral-300">+{dedup.length - max}</div>
      )}
    </div>
  );
};
