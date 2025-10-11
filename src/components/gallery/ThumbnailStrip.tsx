"use client";

import clsx from "clsx";
import React, { useEffect, useRef } from "react";

interface Props {
  images: string[];
  activeIndex: number;
  onSelect: (idx: number) => void;
}

export const ThumbnailStrip: React.FC<Props> = ({ images, activeIndex, onSelect }) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!scrollerRef.current || !activeRef.current) return;
    const container = scrollerRef.current;
    const el = activeRef.current;
    const containerCenter = container.clientWidth / 2;
    const elCenter = el.offsetLeft + el.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, elCenter - containerCenter), behavior: "smooth" });
  }, [activeIndex]);

  // Recenter on resize to keep the active thumb centered when viewport changes
  useEffect(() => {
    const recenter = () => {
      if (!scrollerRef.current || !activeRef.current) return;
      const container = scrollerRef.current;
      const el = activeRef.current;
      const containerCenter = container.clientWidth / 2;
      const elCenter = el.offsetLeft + el.clientWidth / 2;
      container.scrollTo({ left: Math.max(0, elCenter - containerCenter), behavior: "auto" });
    };
    window.addEventListener("resize", recenter);
    return () => window.removeEventListener("resize", recenter);
  }, []);

  return (
    <div ref={scrollerRef} className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center gap-2 p-2 mx-auto w-max rounded-xl bg-black/35 backdrop-blur-md shadow-lg ring-1 ring-divider">
        {images.map((src, i) => (
          <button
            key={src + i}
            ref={i === activeIndex ? activeRef : undefined}
            onClick={() => onSelect(i)}
            className={clsx(
              "relative w-14 aspect-square rounded border overflow-hidden transition-all",
              i === activeIndex ? "ring-2 ring-white" : "ring-1 ring-neutral-300 hover:ring-neutral-400"
            )}
          >
            <img src={src} alt="thumb" className="w-full h-full object-cover cursor-pointer" draggable={false} />
          </button>
        ))}
      </div>
    </div>
  );
};
