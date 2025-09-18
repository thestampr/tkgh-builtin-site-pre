"use client";

import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

interface AppBarProps {
  children?: React.ReactNode;
  leading?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  bottom?: React.ReactNode;
  automaticallyImplyLeading?: boolean;
  floating?: boolean;
  underline?: boolean;
  backdropBlur?: boolean;
  className?: string;
  elevation?: number;
  scrolledUnderElevation?: number;
  scrolledUnderClassName?: string;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  // When true: use the main window scroll (ignores scrollContainerRef)
  primary?: boolean;
  // Only effective when floating is true
  pinned?: boolean;
  // When true: snap to nearest state (hide/show) on scroll idle with smooth animation
  // When false: no auto snap on idle
  snap?: boolean;
  // How much of downward delta to use for hiding (1.0 = match finger exactly)
  hideDownFactor?: number;
  // How much of upward delta to use for revealing (1.0 = match finger exactly)
  revealUpFactor?: number;
}

const FORCE_BACK: boolean = true;

// Shadow mapping
const getShadowClass = (level: number): string => {
  const n = Math.max(0, Math.floor(level));
  switch (n) {
    case 0:
      return "shadow-none";
    case 1:
      return "shadow-b-sm";
    case 2:
      return "shadow-b-md";
    case 3:
      return "shadow-b-lg";
    case 4:
      return "shadow-b-xl";
    case 5:
      return "shadow-b-2xl";
    default:
      return "shadow-b-3xl";
  }
};

// Find nearest scrollable parent; fallback to window
const getScrollableParent = (
  el: HTMLElement | null,
  maxLevels = 5
): Window | HTMLElement => {
  if (typeof window === "undefined" || !el) return window as Window;

  let current: HTMLElement | null = el.parentElement;
  let level = 0;

  while (current && level < maxLevels) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    const canScrollY =
      overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";

    if (canScrollY) {
      return current;
    }

    current = current.parentElement;
    level += 1;
  }

  return window;
};

const isWindow = (t: Window | HTMLElement | null): t is Window => {
  return typeof window !== "undefined" && t === window;
};

const getWindowScrollTop = (): number => {
  if (typeof window === "undefined") return 0;
  return (
    window.scrollY ??
    (window as any).pageYOffset ??
    document.documentElement.scrollTop ??
    document.body.scrollTop ??
    0
  );
};

const getElementScrollTop = (el: HTMLElement | null): number => {
  return el?.scrollTop ?? 0;
};

// Only read scrollTop from the actual target
const getEffectiveScrollTop = (t: Window | HTMLElement | null): number => {
  if (isWindow(t)) return getWindowScrollTop();
  return getElementScrollTop(t as HTMLElement);
};

export const AppBar: React.FC<AppBarProps> = ({
  children,
  leading,
  title,
  subtitle,
  actions,
  bottom,
  automaticallyImplyLeading,
  floating = false,
  underline = false,
  backdropBlur = false,
  className,
  elevation = 0,
  scrolledUnderElevation = 1,
  scrolledUnderClassName = "",
  scrollContainerRef,
  primary = false,
  pinned = true,
  snap = true,
  hideDownFactor = 1.0,
  revealUpFactor = 1.0
}) => {
  const router = useRouter();

  // Refs
  const rootRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<Window | HTMLElement | null>(null);
  const lastPosRef = useRef<number>(0);
  const headerHRef = useRef<number>(0);
  const hideOffsetRef = useRef<number>(0); // 0..headerH
  const isPointerDownRef = useRef<boolean>(false);
  const isAnimatingRef = useRef<boolean>(false);
  const animTokenRef = useRef<number>(0);
  const idleTimerRef = useRef<number | null>(null);
  const lastDirRef = useRef<0 | 1 | -1>(0); // 1=down, -1=up

  // Overlay mode flags (for floating && !pinned case)
  // overlayActive: when AppBar appears floating (revealed mid-scroll)
  // canEnterOverlay: becomes true after the AppBar has been fully hidden at least once since leaving the top
  const overlayActiveRef = useRef<boolean>(false);
  const canEnterOverlayRef = useRef<boolean>(false);

  // Minimal React state to avoid frequent re-render
  const [scrolledUnder, setScrolledUnder] = useState<boolean>(false);

  // Memoized nodes
  const titleNode = useMemo(() => {
    if (typeof title === "string") {
      return <h1 className={clsx("text-xl font-bold text-black")}>{title}</h1>;
    }
    return React.isValidElement(title) ? title : null;
  }, [title]);

  const subtitleNode = useMemo(() => {
    if (typeof subtitle === "string") {
      return <p className={clsx("text-xs text-gray-600")}>{subtitle}</p>;
    }
    return React.isValidElement(subtitle) ? subtitle : null;
  }, [subtitle]);

  const handleBack = () => {
    if (FORCE_BACK) return router.back();

    if (typeof document !== "undefined" && typeof window !== "undefined") {
      if (document.referrer && document.referrer.includes(window.location.origin)) {
        return router.back();
      }
    }
    router.push("/");
  };

  // Measure header height
  const measureHeader = () => {
    const h = contentRef.current?.offsetHeight ?? 0;
    if (h > 0) headerHRef.current = h;
  };

  // Apply transform immediately without React state
  const applyHideOffsetImmediate = (offsetPx: number) => {
    const el = rootRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(headerHRef.current, offsetPx));
    hideOffsetRef.current = clamped;
    el.style.transform = `translate3d(0, ${-clamped}px, 0)`;
  };

  // Animate hide offset to target
  const animateHideOffsetTo = (target: number, durationMs?: number) => {
    const start = hideOffsetRef.current;
    const end = Math.max(0, Math.min(headerHRef.current, target));
    const distance = end - start;
    if (Math.abs(distance) < 0.5) {
      applyHideOffsetImmediate(end);
      return;
    }

    const headerH = Math.max(1, headerHRef.current);
    const duration = Math.max(
      120,
      Math.min(360, durationMs ?? (160 + Math.min(240, Math.round((Math.abs(distance) / headerH) * 200))))
    );

    const token = ++animTokenRef.current;
    isAnimatingRef.current = true;

    const startTime = performance.now();
    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

    const step = (now: number) => {
      if (token !== animTokenRef.current) {
        isAnimatingRef.current = false;
        return;
      }
      const p = Math.min(1, (now - startTime) / duration);
      const eased = easeOutCubic(p);
      const next = start + distance * eased;
      applyHideOffsetImmediate(next);
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        isAnimatingRef.current = false;
      }
    };
    requestAnimationFrame(step);
  };

  // Initialize metrics early to avoid initial jump
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    measureHeader();
    applyHideOffsetImmediate(0);
  }, []);

  // Main scroll logic with immediate DOM updates (no rAF delay)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const providedScrollEl = primary
    ? window
    : scrollContainerRef?.current ?? null;
    const target = providedScrollEl ?? getScrollableParent(rootRef.current);
    const hasBottom = React.Children.count(<>{bottom && <div></div>}</>) > 0; // simply null & undefined check not work, so use this, idk why????
    targetRef.current = target;

    const clearIdleTimer = () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };

    const scheduleIdleSnap = () => {
      clearIdleTimer();
      // Snap only when eligible:
      // - snap enabled
      // - floating and not pinned
      // - has been fully hidden at least once since leaving top
      if (!snap || !floating || pinned) return;
      if (!canEnterOverlayRef.current) return;

      idleTimerRef.current = window.setTimeout(() => {
        idleTimerRef.current = null;
        if (isPointerDownRef.current) return;
        if (isAnimatingRef.current) return;

        const hidden = hideOffsetRef.current;
        if (hidden <= 0) return;

        const headerH = Math.max(1, headerHRef.current);
        const ratio = hidden / headerH;

        // Direction-biased snap thresholds
        let threshold = 0.5;
        if (lastDirRef.current > 0) threshold = 0.35;      // bias to hide if last move was down
        else if (lastDirRef.current < 0) threshold = 0.65; // bias to show if last move was up

        const targetOffset = ratio >= threshold ? headerH : 0;
        animateHideOffsetTo(targetOffset);
      }, 140);
    };

    // Thresholds
    const TOP_CLEAR_PX = 1;   // treat as top when scrollTop <= 1px
    const DIR_EPS = 0.2;      // minimal delta to consider a direction change
    const VIS_EPS = 0.5;      // visibility epsilon

    const recomputeImmediate = () => {
      if (!rootRef.current) return;

      if (headerHRef.current === 0) measureHeader();

      const pos = getEffectiveScrollTop(targetRef.current);
      const prev = lastPosRef.current;
      const delta = pos - prev;

      const atTop = pos <= TOP_CLEAR_PX;
      const headerH = Math.max(0, headerHRef.current);
      const visibleAmount = Math.max(0, headerH - hideOffsetRef.current);
      const headerVisible = visibleAmount > VIS_EPS;
      const fullyVisible = hideOffsetRef.current <= VIS_EPS;
      const fullyHidden = hideOffsetRef.current >= Math.max(0, headerH - VIS_EPS);

      // Pinned mode: attached; show shadow only when scrolled
      if (pinned) {
        if (hideOffsetRef.current !== 0) applyHideOffsetImmediate(0);
        overlayActiveRef.current = false;
        canEnterOverlayRef.current = false;
        const under = pos > TOP_CLEAR_PX;
        setScrolledUnder((prevUnder) => (prevUnder === under ? prevUnder : under));
        if (delta > 0) lastDirRef.current = 1;
        else if (delta < 0) lastDirRef.current = -1;
        else lastDirRef.current = 0;
        lastPosRef.current = pos;
        return;
      }

      // Non-floating: always attached with no shadow logic
      if (!floating) {
        if (hideOffsetRef.current !== 0) applyHideOffsetImmediate(0);
        overlayActiveRef.current = false;
        canEnterOverlayRef.current = false;
        setScrolledUnder((prevUnder) => (prevUnder ? false : prevUnder));
        lastDirRef.current = 0;
        lastPosRef.current = pos;
        return;
      }

      // When back at the very top: force content mode and reset overlay eligibility
      if (atTop) {
        if (hideOffsetRef.current !== 0) applyHideOffsetImmediate(0);
        overlayActiveRef.current = false;
        canEnterOverlayRef.current = false;
        setScrolledUnder((prevUnder) => (prevUnder ? false : prevUnder));
        lastDirRef.current = 0;
        lastPosRef.current = pos;
        return;
      }

      // Cancel any running animation while actively scrolling
      if (isPointerDownRef.current && isAnimatingRef.current) {
        ++animTokenRef.current;
        isAnimatingRef.current = false;
      }

      // Immediate response to scroll delta
      if (delta > 0) {
        // Scrolling down: hide immediately
        lastDirRef.current = 1;
        const remaining = Math.max(0, headerHRef.current - hideOffsetRef.current);
        if (remaining > 0 && hideDownFactor > 0) {
          const used = Math.min(remaining, delta * hideDownFactor);
          if (used !== 0) applyHideOffsetImmediate(hideOffsetRef.current + used);
        }
      } else if (delta < 0) {
        // Scrolling up: reveal immediately
        lastDirRef.current = -1;
        if (hideOffsetRef.current > 0 && revealUpFactor > 0) {
          const intent = Math.abs(delta) * revealUpFactor;
          const used = Math.min(hideOffsetRef.current, intent);
          if (used !== 0) applyHideOffsetImmediate(hideOffsetRef.current - used);
        }
      }

      // Track transitions:
      // - Unlock overlay/snap eligibility only after fully hidden at least once since leaving top
      if (fullyHidden) {
        canEnterOverlayRef.current = true;
        overlayActiveRef.current = true;
      }

      // - Enter overlay when scrolling up (meaningful) mid-page and eligible
      if (delta < -DIR_EPS && !atTop && !fullyHidden && canEnterOverlayRef.current) {
        overlayActiveRef.current = true;
      }

      // Shadow reflects overlay look only in floating mode
      const shouldBeUnder = floating && ((overlayActiveRef.current && headerVisible) || (hasBottom && fullyHidden));
      setScrolledUnder((prevUnder) => (prevUnder === shouldBeUnder ? prevUnder : shouldBeUnder));

      lastPosRef.current = pos;
    };

    const onScroll = () => {
      recomputeImmediate();
      scheduleIdleSnap();
    };

    const onResize = () => {
      const prevH = headerHRef.current;
      measureHeader();
      if (prevH !== headerHRef.current) {
        applyHideOffsetImmediate(Math.min(hideOffsetRef.current, headerHRef.current));
      }
      const pos = getEffectiveScrollTop(targetRef.current);
      const atTop = pos <= 1;
      const headerH = Math.max(0, headerHRef.current);
      const headerVisible = (headerH - hideOffsetRef.current) > 0.5;
      let shouldBeUnder = false;
      if (pinned) {
        shouldBeUnder = pos > 1;
      } else if (floating) {
        shouldBeUnder = overlayActiveRef.current && headerVisible && !atTop;
      } else {
        shouldBeUnder = false;
      }
      setScrolledUnder((prevUnder) => (prevUnder === shouldBeUnder ? prevUnder : shouldBeUnder));
    };

    const onPointerDown = () => {
      isPointerDownRef.current = true;
      if (isAnimatingRef.current) {
        ++animTokenRef.current;
        isAnimatingRef.current = false;
      }
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
    const onPointerUp = () => {
      isPointerDownRef.current = false;
      scheduleIdleSnap();
    };

    // Initial values
    lastPosRef.current = getEffectiveScrollTop(targetRef.current);
    lastDirRef.current = 0;
    overlayActiveRef.current = false;
    canEnterOverlayRef.current = false;

    // Listeners
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("touchend", onPointerUp, { passive: true });

    let removeTargetListener: (() => void) | null = null;
    if (!primary && !isWindow(target)) {
      const el = target as HTMLElement;
      el.addEventListener("scroll", onScroll, { passive: true });
      removeTargetListener = () => el.removeEventListener("scroll", onScroll);
    }

    // Initial compute
    recomputeImmediate();
    setTimeout(() => {
      // dispatch scroll event
      target.dispatchEvent(new Event("scroll"));
    }, 0);

    return () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("touchend", onPointerUp);
      if (removeTargetListener) removeTargetListener();
    };
  }, [floating, pinned, snap, hideDownFactor, revealUpFactor, scrollContainerRef?.current]);

  // Force visible and recompute shadow when pinned or not floating changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const pos = getEffectiveScrollTop(targetRef.current ?? window);
    if (pinned) {
      applyHideOffsetImmediate(0);
      overlayActiveRef.current = false;
      canEnterOverlayRef.current = false;
      setScrolledUnder(pos > 1);
    } else if (!floating) {
      applyHideOffsetImmediate(0);
      overlayActiveRef.current = false;
      canEnterOverlayRef.current = false;
      setScrolledUnder(false);
    }
  }, [pinned, floating]);

  const floatClass = floating ? "sticky top-0 left-0 right-0 z-10 bg-background w-full" : "";
  const appliedElevation = scrolledUnder ? scrolledUnderElevation : elevation;
  const elevationClass = getShadowClass(appliedElevation);
  const scrolledUnderClass = scrolledUnder ? scrolledUnderClassName : "";

  return (
    <>
      <header
        ref={rootRef}
        data-floating={floating}
        data-pinned={pinned}
        data-snap={snap}
        data-hide-offset={hideOffsetRef.current.toFixed(1)}
        className={clsx(
          "app-bar",
          "transform-gpu will-change-transform",
          "transition-shadow duration-300 ease-in-out",
          underline && "border-b border-gray-200",
          floatClass,
          elevationClass,
          scrolledUnderClass
        )}
      >
        <div ref={contentRef} className="app-bar-content">
          { children
            ? children
            : <>
              <div
                className={clsx(
                  "flex items-center justify-between h-20 px-4 max-w-5xl mx-auto",
                  className
                )}
              >
                <div className="flex items-center gap-3">
                  {leading != null
                    ? leading
                    : automaticallyImplyLeading && (
                      <button
                        className="p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={handleBack}
                      >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
                  <div className="flex flex-col gap-0.5">
                    {titleNode}
                    {subtitleNode}
                  </div>
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
              </div>
            </>
          }
        </div>

        { bottom }

        { backdropBlur && 
          <span className={clsx(
            "fixed inset-0 -z-1 pointer-events-none",
            "transition-all duration-300 ease-in-out",
            scrolledUnder ? "backdrop-blur-lg" : "opacity-0"
          )} /> 
        }
      </header>
    </>
  );
};

export default AppBar;