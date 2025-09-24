"use client";
import React from "react";

interface GalleryEditorProps {
  images: string[];
  onChange: (imgs: string[]) => void;
  onUpload: (files: FileList | null) => void;
  t: (k: string) => string;
  max?: number;
  className?: string;
}

export const GalleryEditor: React.FC<GalleryEditorProps> = ({ images, onChange, onUpload, t, max = 12, className = "" }) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-[11px] uppercase tracking-wide text-neutral-500">{t("imagesLabel")}</label>
      <div className="flex flex-wrap gap-2">
        {images.map((g, i) => (
          <div key={i} className="relative group">
            <img src={g} className={`h-24 w-24 object-cover rounded border ${i === 0 ? "ring-2 ring-primary/70 ring-offset-2 ring-offset-white" : ""}`} />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/30 flex flex-col items-center justify-center gap-2 text-[10px] text-white transition">
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const arr = [...images];
                    const [img] = arr.splice(i, 1);
                    onChange([img, ...arr]);
                  }}
                  className="btn btn-secondary btn-xs !border-white/40"
                >
                  {t("makeCover")}
                </button>
              )}
              <button
                type="button"
                onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                className="btn btn-danger btn-xs"
              >
                {t("remove")}
              </button>
            </div>
            {i === 0 && (
              <span className="absolute bottom-1 left-1 bg-black/60 text-[10px] px-1.5 py-0.5 rounded">
                {t("coverBadge")}
              </span>
            )}
          </div>
        ))}
        {images.length < max && (
          <label className="h-24 w-24 border border-dashed rounded flex flex-col items-center justify-center text-[10px] text-neutral-500 cursor-pointer hover:bg-neutral-50">
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={e => onUpload(e.target.files)}
            />
            {t("upload")}
          </label>
        )}
      </div>
      <p className="text-[10px] text-neutral-400">{t("imagesHint")}</p>
    </div>
  );
};
