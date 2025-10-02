"use client"

import ResponsiveSwiper from "@/components/responsive-swiper";
import Image from "next/image";
import { SwiperSlide } from "swiper/react";

type GallerySwiperProps = {
  images: {
    url: string;
    alt?: string | null | undefined;
    width?: number | null | undefined;
    height?: number | null | undefined;
  }[];
  className?: string;
}

const GallerySwiper: React.FC<GallerySwiperProps> = ({ images, className }) => {
  return (
    <ResponsiveSwiper className={className} maxSlidePerView={3}>
      {images.map((img, idx) => (
        <SwiperSlide 
          key={idx}
          className="relative aspect-[4/3] w-full object-cover overflow-hidden rounded-xl border bg-white"
        >
          <Image
            src={img.url}
            alt={img.alt || `Image ${idx + 1}`}
            fill
          />
        </SwiperSlide>
      ))}
    </ResponsiveSwiper>
  );
};

export default GallerySwiper;