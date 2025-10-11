"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { ThumbnailStrip } from "./ThumbnailStrip";
import { useGestureViewer } from "./useGestureViewer";

interface Props {
  images: string[];
  index: number;
  onClose: () => void;
  debug?: boolean;
}
export const ImageViewer: React.FC<Props> = ({ images, index, onClose, debug = false }) => {
  const [active, setActive] = useState(index);
  const [open, setOpen] = useState(true);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const lastDoubleClickTs = useRef(0);

  const [, setTick] = useState(0);
  const forceUpdate = () => setTick(t => t + 1);
  const { imageRef, stateRef, handlers, resetTransform } = useGestureViewer({
    allowRotate: false,
    elastic: false,
    enablePanAtScale1: false,
    onUpdate: forceUpdate,
    debug,
  });

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouch = (document.body.style as CSSStyleDeclaration).touchAction || "";
    document.body.style.overflow = "hidden";
    if ("touchAction" in document.body.style) {
      document.body.style.touchAction = "none";
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      if ("touchAction" in document.body.style) {
        document.body.style.touchAction = prevTouch;
      }
    };
  }, [open]);

  const [trackX, setTrackX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [useTransition, setUseTransition] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const commitDirRef = useRef<null | "left" | "right">(null);
  const targetIndexRef = useRef<number | null>(null);
  const clickSwitchRef = useRef(false);
  const activeRef = useRef(active);
  useEffect(() => { activeRef.current = active; }, [active]);

  const canSwipe = () => stateRef.current.scale === 1 && !stateRef.current.pinchZooming;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          return close();
        case "ArrowLeft":
          return goPrev();
        case "ArrowRight":
          return goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const src = images[active];
  // If we are performing a direct click switch (non-adjacent), render the target on the appropriate side panel
  const sideDir: null | "left" | "right" = targetIndexRef.current != null && clickSwitchRef.current
    ? (targetIndexRef.current > active ? "left" : targetIndexRef.current < active ? "right" : null)
    : null;
  const prevSrc = sideDir === "right" && targetIndexRef.current != null
    ? images[targetIndexRef.current]
    : (active > 0 ? images[active - 1] : null);
  const nextSrc = sideDir === "left" && targetIndexRef.current != null
    ? images[targetIndexRef.current]
    : (active < images.length - 1 ? images[active + 1] : null);
  const showSides = stateRef.current.scale === 1 && (isSwiping || isAnimating || useTransition);
  const chromeFade = `transition-opacity duration-200 ${overlayVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`;
  const chromeStyles = "bg-white/15 hover:bg-white/25 text-white cursor-pointer";
  const isChromeTarget = (t: EventTarget | null) => t instanceof Element && !!(t as Element).closest("[data-chrome]");

  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const swipeArmed = useRef(false);
  const SWIPE_ACTIVATE_PX = 8;
  const mouseDownRef = useRef(false);

  // Tap detection (touch/mouse) for overlay toggle
  const TAP_MOVE_PX = 8;
  const TAP_TIME_MS = 200;
  const DOUBLE_TAP_MS = 200;
  const tapStartX = useRef<number | null>(null);
  const tapStartY = useRef<number | null>(null);
  const tapStartTs = useRef<number>(0);
  const tapActive = useRef(false);
  const overlayToggleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitSwipe = (dir: "left" | "right") => {
    const atFirst = activeRef.current <= 0;
    const atLast = activeRef.current >= images.length - 1;
    if ((dir === "right" && atFirst) || (dir === "left" && atLast)) {
      commitDirRef.current = null;
      setUseTransition(true);
      setIsAnimating(true);
      setTrackX(0);
      return;
    }
    commitDirRef.current = dir;
    const width = window.innerWidth;
    setUseTransition(true);
    setIsAnimating(true);
    setTrackX(dir === "left" ? -width : width);
  };

  const slideTo = (toIndex: number) => {
    if (toIndex === activeRef.current) return;
    if (stateRef.current.scale > 1) resetTransform();
    const clamped = Math.max(0, Math.min(images.length - 1, toIndex));
    const delta = Math.abs(clamped - activeRef.current);
    targetIndexRef.current = clamped;
    const dir = clamped > activeRef.current ? "left" : "right";
    if (delta === 1) {
      clickSwitchRef.current = false;
      commitSwipe(dir);
    } else {
      // direct click switch: animate one width, render target on the side
      clickSwitchRef.current = true;
      setUseTransition(true);
      setIsAnimating(true);
      const width = window.innerWidth;
      setTrackX(dir === "left" ? -width : width);
    }
  };

  const onTouchStartCap = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    if (isChromeTarget(e.target)) {
      // interacting with chrome; cancel any pending overlay toggle and don"t start tap/swipe
      if (overlayToggleTimerRef.current) { clearTimeout(overlayToggleTimerRef.current); overlayToggleTimerRef.current = null; }
      tapActive.current = false;
      return;
    }
    // cancel pending overlay toggle if a second tap starts within double-tap window
    if (overlayToggleTimerRef.current) { clearTimeout(overlayToggleTimerRef.current); overlayToggleTimerRef.current = null; }
    if (canSwipe()) {
      swipeStartX.current = e.touches[0].clientX;
      swipeStartY.current = e.touches[0].clientY;
      swipeArmed.current = false;
    }
    setUseTransition(false);
    // begin tap candidate
    tapActive.current = true;
    tapStartX.current = e.touches[0].clientX;
    tapStartY.current = e.touches[0].clientY;
    tapStartTs.current = Date.now();
  };
  const onTouchMoveCap = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    // cancel tap if moved too far
    if (tapActive.current && tapStartX.current != null && tapStartY.current != null) {
      const tdx = e.touches[0].clientX - tapStartX.current;
      const tdy = e.touches[0].clientY - tapStartY.current;
      if (Math.hypot(tdx, tdy) > TAP_MOVE_PX) tapActive.current = false;
    }
    if (!canSwipe() || swipeStartX.current == null) return;
    const dx = e.touches[0].clientX - swipeStartX.current;
    const dy = e.touches[0].clientY - (swipeStartY.current ?? e.touches[0].clientY);
    if (!swipeArmed.current) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_ACTIVATE_PX) {
        swipeArmed.current = true;
        setIsSwiping(true);
      } else return;
    }
    setTrackX(dx);
    e.preventDefault();
  };
  const onTouchEndCap = (e: React.TouchEvent) => {
    if (!isSwiping) {
      // consider as a tap end if within thresholds
      const now = Date.now();
      const timeOk = now - tapStartTs.current <= TAP_TIME_MS;
      const moveOk = tapStartX.current != null && tapStartY.current != null;
      if (tapActive.current && moveOk && timeOk) {
        // schedule toggle after DOUBLE_TAP_MS to avoid double-tap conflict
        if (overlayToggleTimerRef.current) { clearTimeout(overlayToggleTimerRef.current); }
        overlayToggleTimerRef.current = setTimeout(() => {
          setOverlayVisible(v => !v);
          overlayToggleTimerRef.current = null;
        }, DOUBLE_TAP_MS);
      }
      tapActive.current = false;
      return;
    }
    const dx = trackX;
    setIsSwiping(false);
    if (dx < -80) commitSwipe("left"); else if (dx > 80) commitSwipe("right");
    else { setUseTransition(true); setIsAnimating(true); setTrackX(0); }
    e.preventDefault();
  };
  const onMouseDownCap = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (isChromeTarget(e.target)) {
      if (overlayToggleTimerRef.current) { clearTimeout(overlayToggleTimerRef.current); overlayToggleTimerRef.current = null; }
      tapActive.current = false;
      return;
    }
    if (overlayToggleTimerRef.current) { clearTimeout(overlayToggleTimerRef.current); overlayToggleTimerRef.current = null; }
    if (canSwipe()) {
      swipeStartX.current = e.clientX;
      swipeStartY.current = e.clientY;
      swipeArmed.current = false;
    }
    mouseDownRef.current = true;
    setUseTransition(false);
    // tap candidate for mouse
    tapActive.current = true;
    tapStartX.current = e.clientX;
    tapStartY.current = e.clientY;
    tapStartTs.current = Date.now();
  };
  const onMouseMoveCap = (e: React.MouseEvent) => {
    if (!mouseDownRef.current) return;
    if (tapActive.current && tapStartX.current != null && tapStartY.current != null) {
      const tdx = e.clientX - tapStartX.current;
      const tdy = e.clientY - tapStartY.current;
      if (Math.hypot(tdx, tdy) > TAP_MOVE_PX) tapActive.current = false;
    }
    if (!canSwipe() || swipeStartX.current == null) return;
    const dx = e.clientX - swipeStartX.current;
    const dy = e.clientY - (swipeStartY.current ?? e.clientY);
    if (!swipeArmed.current) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_ACTIVATE_PX) {
        swipeArmed.current = true; setIsSwiping(true);
      } else return;
    }
    setTrackX(dx);
    e.preventDefault();
  };
  const onMouseUpCap = (e: React.MouseEvent) => {
    if (mouseDownRef.current) {
      mouseDownRef.current = false;
      if (isSwiping) {
        const dx = trackX;
        setIsSwiping(false);
        if (dx < -80) commitSwipe("left"); else if (dx > 80) commitSwipe("right");
        else { setUseTransition(true); setIsAnimating(true); setTrackX(0); }
        e.preventDefault();
      } else {
        // non-swipe click => tap candidate
        const now = Date.now();
        const timeOk = now - tapStartTs.current <= TAP_TIME_MS;
        if (tapActive.current && timeOk) {
          if (overlayToggleTimerRef.current) { clearTimeout(overlayToggleTimerRef.current); }
          overlayToggleTimerRef.current = setTimeout(() => {
            setOverlayVisible(v => !v);
            overlayToggleTimerRef.current = null;
          }, DOUBLE_TAP_MS);
        }
        tapActive.current = false;
      }
      swipeStartX.current = null;
      swipeStartY.current = null;
      swipeArmed.current = false;
    }
  };
  const onMouseLeaveCap = () => {
    // cancel swipe if pointer leaves the area
    if (mouseDownRef.current) {
      mouseDownRef.current = false;
      setIsSwiping(false);
      setUseTransition(true);
      setIsAnimating(true);
      setTrackX(0);
      swipeStartX.current = null;
      swipeStartY.current = null;
      swipeArmed.current = false;
    }
  };

  const clearSwipeRefs = () => {
    swipeStartX.current = null;
    swipeStartY.current = null;
    swipeArmed.current = false;
    mouseDownRef.current = false;
    setIsSwiping(false);
  };
  const goPrev = () => { if (stateRef.current.scale > 1) resetTransform(); clearSwipeRefs(); commitSwipe("right"); };
  const goNext = () => { if (stateRef.current.scale > 1) resetTransform(); clearSwipeRefs(); commitSwipe("left"); };
  const close = () => { setOpen(false); setTimeout(onClose, 180); };

  const backdrop = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
  const panel = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } };

  const trackStyle = (dx: number, withTransition: boolean, swiping: boolean) => ({
    transform: `translate3d(${dx}px,0,0)`,
    transition: withTransition
      ? "transform 0.3s cubic-bezier(0.33,1,0.68,1)"
      : swiping
        ? "transform 0.04s linear"
        : "transform 0s",
    willChange: "transform" as const,
    backfaceVisibility: "hidden" as const,
  });

  const marker = (x: number, y: number, bg: string, border: string) => ({
    position: "absolute" as const,
    left: x - 18,
    top: y - 18,
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: bg,
    border,
    pointerEvents: "none" as const,
    zIndex: 20,
  });

  const DebugOverlay = () => {
    return debug && stateRef.current.debugPoints && (
      <>
        {stateRef.current.debugPoints.touch1 && (
          <div style={marker(stateRef.current.debugPoints.touch1.x, stateRef.current.debugPoints.touch1.y, "rgba(255,0,0,0.45)", "2px solid rgba(255,0,0,0.7)")} />
        )}
        {stateRef.current.debugPoints.touch2 && (
          <div style={marker(stateRef.current.debugPoints.touch2.x, stateRef.current.debugPoints.touch2.y, "rgba(0,120,255,0.45)", "2px solid rgba(0,120,255,0.7)")} />
        )}
        {stateRef.current.debugPoints.touch3 && (
          <div style={marker(stateRef.current.debugPoints.touch3.x, stateRef.current.debugPoints.touch3.y, "rgba(220,120,0,0.45)", "2px solid rgba(220,120,0,0.7)")} />
        )}
        {stateRef.current.debugPoints.midpoint && (
          <div style={marker(stateRef.current.debugPoints.midpoint.x, stateRef.current.debugPoints.midpoint.y, "rgba(30,220,70,0.35)", "2px solid rgba(30,220,70,0.7)")} />
        )}
        {stateRef.current.debugPoints.centroid && (
          <div style={marker(stateRef.current.debugPoints.centroid.x, stateRef.current.debugPoints.centroid.y, "rgba(200,0,220,0.35)", "2px solid rgba(200,0,220,0.7)")} />
        )}
      </>
    )
  };

  const handleClose = (e: React.MouseEvent) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const isOutside = (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom);

    if (isOutside) {
      close();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[1100]" initial="hidden" animate="visible" exit="exit" variants={backdrop}>
          <div className="absolute inset-0 bg-black/80" />
          <motion.div className="absolute inset-0 flex flex-col" variants={panel}>
            <div className="relative flex-1 flex items-center justify-center overflow-hidden select-none touch-none overscroll-contain"
              onWheelCapture={(e) => e.preventDefault()}
              onTouchStartCapture={onTouchStartCap}
              onTouchMoveCapture={onTouchMoveCap}
              onTouchEndCapture={onTouchEndCap}
              onMouseDownCapture={onMouseDownCap}
              onMouseMoveCapture={onMouseMoveCap}
              onMouseUpCapture={onMouseUpCap}
              onMouseLeave={onMouseLeaveCap}
              onClick={handleClose}
            >
              <div className="absolute inset-0"
                style={trackStyle(trackX, useTransition, isSwiping)}
                onTransitionEnd={(e) => {
                  if (e.propertyName !== "transform" || !useTransition || !isAnimating) return;
                  if (clickSwitchRef.current && targetIndexRef.current != null) {
                    // finalize direct switch to target
                    const finalIdx = targetIndexRef.current;
                    activeRef.current = finalIdx; setActive(finalIdx); resetTransform();
                    targetIndexRef.current = null;
                    clickSwitchRef.current = false;
                  } else {
                    const dir = commitDirRef.current;
                    if (dir) {
                      const curr = activeRef.current;
                      const next = dir === "left" ? Math.min(images.length - 1, curr + 1) : Math.max(0, curr - 1);
                      activeRef.current = next; setActive(next); resetTransform();
                    }
                    // chain multi-step only when not in click-switch mode
                    const target = targetIndexRef.current;
                    if (target != null) {
                      const now = activeRef.current;
                      const still = target > now ? "left" : (target < now ? "right" : null);
                      if (still) { requestAnimationFrame(() => commitSwipe(still)); } else { targetIndexRef.current = null; }
                    }
                  }
                  commitDirRef.current = null; setUseTransition(false); setIsAnimating(false); setTrackX(0);
                  // clear swipe refs to avoid stuck-following mouse
                  swipeStartX.current = null; swipeStartY.current = null; swipeArmed.current = false; mouseDownRef.current = false; setIsSwiping(false);
                }}
              >
                {prevSrc && (
                  <img src={prevSrc} alt="prev" aria-hidden className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none p-6 sm:p-12 md:p-24" style={{ transform: "translate3d(-100%,0,0)", visibility: showSides ? "visible" : "hidden" }} draggable={false} />
                )}
                {/* current */}
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-6 sm:p-12 md:p-24">
                  <img
                    ref={imageRef}
                    src={src}
                    alt="image"
                    className={clsx(
                      stateRef.current.fitMode === "w" ? "w-full h-auto" : "w-auto h-full",
                      stateRef.current.scale === 1
                        ? "cursor-zoom-in"
                        : stateRef.current.dragging
                          ? "cursor-grabbing"
                          : "cursor-grab"
                    )}
                    // Let the gesture hook fully control transform styles (rAF-driven)
                    onLoad={handlers.onImageLoad}
                    onWheel={handlers.onWheel}
                    onMouseDown={handlers.onMouseDown}
                    onMouseMove={handlers.onMouseMove}
                    onMouseUp={handlers.onMouseUp}
                    onDoubleClick={(e) => {
                      // cancel any pending overlay toggle when performing double-click zoom
                      if (overlayToggleTimerRef.current) { clearTimeout(overlayToggleTimerRef.current); overlayToggleTimerRef.current = null; }
                      lastDoubleClickTs.current = Date.now();
                      handlers.onDoubleClick(e);
                    }}
                    onTouchStart={handlers.onTouchStart}
                    onTouchMove={handlers.onTouchMove}
                    onTouchEnd={handlers.onTouchEnd}
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                  />
                </div>
                {nextSrc && (
                  <img src={nextSrc} alt="next" aria-hidden className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none p-6 sm:p-12 md:p-24" style={{ transform: "translate3d(100%,0,0)", visibility: showSides ? "visible" : "hidden" }} draggable={false} />
                )}

                {/* Debug overlays */}
                <DebugOverlay />
              </div>

              {/* Prev / Next */}
              {active > 0 && (
                <button data-chrome onClick={(e) => { e.stopPropagation(); goPrev(); }} className={clsx("absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full", chromeFade, chromeStyles)}><ChevronLeft /></button>
              )}
              {active < images.length - 1 && (
                <button data-chrome onClick={(e) => { e.stopPropagation(); goNext(); }} className={clsx("absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full", chromeFade, chromeStyles)}><ChevronRight /></button>
              )}
              <button data-chrome onClick={(e) => { e.stopPropagation(); close(); }} className={clsx("absolute top-3 right-3 p-2 rounded-md", chromeFade, chromeStyles)}><X /></button>
            </div>

            {/* Thumbnails */}
            <div data-chrome className={clsx("pointer-events-auto", chromeFade)} onClick={(e) => e.stopPropagation()}>
              <div className="absolute left-0 right-0 bottom-0">
                <div className="h-24 px-3 pb-3 pt-2 flex items-center" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.5) 100%)" }}>
                  <ThumbnailStrip images={images} activeIndex={active} onSelect={(i) => slideTo(i)} />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
