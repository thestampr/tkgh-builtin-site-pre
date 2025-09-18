"use client";

import { useEffect } from "react";

type HeroProps = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  cta?: React.ReactNode;
  extendBackground?: boolean;
  opacity?: number;
  children?: React.ReactNode;
};

export default function Hero({ 
  title, 
  subtitle, 
  cta,
  extendBackground, 
  opacity=0.6,
  children 
}: HeroProps) {
  useEffect(() => {
    // Add data-extended attribute to body
    const bodyElement = document.body;
    if (bodyElement) {
      bodyElement.setAttribute("data-extended", String(extendBackground));
    }
    return () => {
      bodyElement.removeAttribute("data-extended");
    };
  }, [extendBackground]);

  const TitleNode = () => {
    if (!title) return null;
    if (typeof title === "string") {
      return <h1 className="text-4xl lg:text-6xl font-extrabold">{title}</h1>;
    }
    return title;
  };

  const SubtitleNode = () => {
    if (!subtitle) return null;
    if (typeof subtitle === "string") {
      return <p className="mt-4 max-w-2xl text-lg text-gray-200">{subtitle}</p>;
    }
    return subtitle;
  };

  return (
    <div className="w-full overflow-hidden">
      { extendBackground && 
        <>
          {/* hero image to extend behind NavBar */}
          <div className="absolute top-0 left-0 right-0 overflow-hidden z-5">
            {children}
            <div className="absolute inset-0 bg-black" style={{ opacity }} />
          </div>

          {/* Gradient overlay */}
          <div className="absolute h-24 inset-0 bg-gradient-to-t from-transparent to-black/40" />
        </>
      }

      {/* Hero content */}
      <section className="relative">
        { extendBackground 
          ? <div className="opacity-0">
              {/* Hero image placeholder */}
              {children}
            </div>
          : children
        }

        {/* <div className="absolute inset-0 bg-black/40" /> */}
        <div className="absolute inset-0 flex items-center px-8 lg:px-18 xl:px-26 mb-24 z-5">
          <div className="text-white">
            <TitleNode />
            <SubtitleNode />
            {cta}
          </div>
        </div>
      </section>
    </div>
  );
}