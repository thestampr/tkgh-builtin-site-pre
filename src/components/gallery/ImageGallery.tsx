"use client";

import ResponsiveSwiper from "@/components/responsive-swiper";
import Image from "next/image";
import React, { useState } from "react";
import { SwiperSlide } from "swiper/react";
import { ImageViewer } from "./ImageViewer";

interface Props {
  imageSrcList: string[];
  className?: string;
}

export const ImageGallery: React.FC<Props> = ({ imageSrcList, className }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <ResponsiveSwiper className={className} maxSlidePerView={3}>
        {imageSrcList.map((src, i) => (
          <SwiperSlide
            key={src + i}
            className="relative aspect-[4/3] w-full object-cover overflow-hidden rounded-xl border border-divider bg-white"
          >
            <Image
              src={src}
              alt={`Image ${i + 1}`}
              className="object-cover cursor-pointer"
              draggable={false}
              fill
              onClick={() => setOpenIndex(i)}
            />
          </SwiperSlide>
        ))}
      </ResponsiveSwiper>

      {openIndex !== null && (
        <ImageViewer
          images={imageSrcList}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
};
