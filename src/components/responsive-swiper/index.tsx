"use client";

import clsx from "clsx";
import "./style.css";

import { useCallback, useEffect, useState } from "react";
import "swiper/css";
import 'swiper/css/autoplay';
import "swiper/css/navigation";
import 'swiper/css/pagination';
import { Navigation } from "swiper/modules";
import { Swiper } from "swiper/react";

const baseShadowStyle = "h-full z-1 absolute top-0 w-12 lg:w-24 xl:w-48 transition-colors duration-300 ease-in-out from-white to-transparent";

type ResponsiveSwiperProps = {
  children: React.ReactNode;
  theme?: "light" | "dark" | "auto";
  className?: string;
  swiperClassName?: string;
  maxSlidePerView?: number
}

export default function ResponsiveSwiper({
  children,
  theme = "auto",
  className,
  swiperClassName,
  maxSlidePerView
}: ResponsiveSwiperProps) {
  const [viewportWidth, setViewportWidth] = useState(0);
  useEffect(() => {
    setViewportWidth(window.innerWidth);
  }, []);
  const onSizeChange = useCallback(() => {
    setViewportWidth(window.innerWidth);
  }, []);
  useEffect(() => {
    window.addEventListener("resize", onSizeChange);
    return () => {
      window.removeEventListener("resize", onSizeChange);
    }
  }, []);

  maxSlidePerView ??= 5;

  let slidesPerView = 5;
  if (viewportWidth <= 640) {
    slidesPerView = 1;
  } else if (viewportWidth <= 768) {
    slidesPerView = 2;
  } else if (viewportWidth <= 1024) {
    slidesPerView = 3;
  } else if (viewportWidth <= 1280) {
    slidesPerView = 4;
  } else if (viewportWidth <= 1536) {
    slidesPerView = 5;
  }

  slidesPerView = Math.max(1, Math.min(slidesPerView, maxSlidePerView));

  return (
    <div className={clsx(
      "relative w-dvw !overflow-x-hidden",
      className
    )}>
      <Swiper 
        data-theme={theme}
        className={clsx(
          "sw-responsive-swiper w-full select-none !overflow-visible",
          swiperClassName
        )}
        spaceBetween={18}
        slidesPerView={slidesPerView}
        navigation={true} 
        modules={[Navigation]} >
          
        {/* Left shadow */}
        <div className={`left-0 transform-[translateX(-100%)] bg-gradient-to-r ${baseShadowStyle}`} />
        {/* Right shadow */}
        <div className={`right-0 transform-[translateX(100%)] bg-gradient-to-l ${baseShadowStyle}`} />
        
        {children}
      </Swiper>
    </div>
  );
}