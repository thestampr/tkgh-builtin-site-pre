"use client";

import { ChevronDown } from "lucide-react";
import { ReactNode, useLayoutEffect, useRef, useState, useEffect } from "react";

interface Timing {
  ease: string;
  duration: number; // milliseconds
}

interface AnimationConfig {
  open: Timing;
  close: Timing;
}

interface DisclosureProps {
  label: ReactNode;
  open?: boolean;
  children: ReactNode;
  className?: string;
  toggleOnLabelClick?: boolean;
  toggleOnChevronClick?: boolean;
  hideToggle?: boolean;
  // either null (no animation) or provide per-direction timing
  animation?: AnimationConfig | null;
}

const defaultAnimation: AnimationConfig = {
  open: { ease: "ease", duration: 200 },
  close: { ease: "ease", duration: 200 },
};

export default function Disclosure({
  label,
  open = false,
  children,
  className = "",
  toggleOnLabelClick = false,
  toggleOnChevronClick = true,
  hideToggle = false,
  animation = defaultAnimation,
}: DisclosureProps) {
  const [isOpen, setIsOpen] = useState(open);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const transitionEndRef = useRef<((ev: TransitionEvent) => void) | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((o) => !o);
  };

  if (!toggleOnLabelClick && !toggleOnChevronClick) {
    console.warn("At least one of toggleOnLabelClick or toggleOnChevronClick must be true.");
  }

  const applyTransition = (el: HTMLDivElement, mode: "open" | "close") => {
    if (!animation) {
      el.style.transition = "none";
      return;
    }
    const t = animation[mode];
    el.style.transition = `height ${t.duration}ms ${t.ease}`;
  };

  // set initial styles synchronously to avoid flicker
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    // initial styles without animation if animation is null
    applyTransition(el, isOpen ? "open" : "close");
    el.style.overflow = isOpen ? "visible" : "hidden";
    el.style.height = isOpen ? "auto" : "0px";
  }, []); // run once on mount

  // animate height on open/close
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    // remove any previous transitionend handler
    if (transitionEndRef.current) {
      el.removeEventListener("transitionend", transitionEndRef.current);
      transitionEndRef.current = null;
    }

    if (!animation) {
      // no animation: apply final state instantly
      el.style.transition = "none";
      el.style.overflow = isOpen ? "visible" : "hidden";
      el.style.height = isOpen ? "auto" : "0px";
      return;
    }

    if (isOpen) {
      // From closed -> open: set to measured height, then set to auto after transition
      applyTransition(el, "open");
      el.style.overflow = "hidden";
      const target = el.scrollHeight;

      // ensure starting height is current computed height (could be 0)
      // then on next frame set to target to animate
      requestAnimationFrame(() => {
        el.style.height = `${target}px`;
      });

      const onEnd = (ev: TransitionEvent) => {
        if (ev.propertyName === "height") {
          // allow content to grow/shrink naturally after animation
          el.style.height = "auto";
          el.style.overflow = "visible";
          el.removeEventListener("transitionend", onEnd);
          transitionEndRef.current = null;
        }
      };
      transitionEndRef.current = onEnd;
      el.addEventListener("transitionend", onEnd);
    } else {
      // From open -> closed: snap to current height then set to 0
      applyTransition(el, "close");
      // If currently "auto", measure scrollHeight first
      const currentHeight = el.scrollHeight;
      el.style.height = `${currentHeight}px`;
      // force reflow so the browser registers the height before we set to 0
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      el.getBoundingClientRect();
      el.style.overflow = "hidden";
      requestAnimationFrame(() => {
        el.style.height = "0px";
      });
      // no need to set overflow after transition; keep hidden when closed
    }

    // cleanup on effect re-run/unmount
    return () => {
      if (transitionEndRef.current) {
        el.removeEventListener("transitionend", transitionEndRef.current);
        transitionEndRef.current = null;
      }
    };
  }, [isOpen, animation]);

  return (
    <div className={`rounded border border-gray-200 bg-gray-50 mb-2 h-fit transition-all ${className}`}>
      <div
        className="flex items-center w-full p-2 text-left"
        onClick={toggleOnLabelClick ? handleClick : undefined}
        aria-expanded={isOpen}
      >
        <span className="max-w-[90%] flex-1">{label}</span>
        <span className="w-[10%] ml-auto flex justify-end">
          {!hideToggle && (
            <button
              type="button"
              className="p-2 rounded-md hover:bg-gray-200 transition-colors"
              onClick={toggleOnChevronClick ? handleClick : undefined}
              aria-label={isOpen ? "Collapse" : "Expand"}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ease-in-out duration-200 ${isOpen ? "rotate-180" : ""
                  }`}
              />
            </button>
          )}
        </span>
      </div>

      {/* Keep content in the DOM so we can animate height both directions */}
      <div ref={contentRef} className="" aria-hidden={!isOpen}>
        <div className="px-4 pb-3">
          {children}
        </div>
      </div>
    </div>
  );
}