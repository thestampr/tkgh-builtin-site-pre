"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

export type Position = { x: number; y: number };

export type GestureState = {
  scale: number;
  position: Position;
  rotation: number; // degrees
  dragging: boolean;
  fitMode: "w" | "h";
  isZooming: boolean;
  pinchZooming: boolean;
  wheeling: boolean;
  debugPoints?: {
    touch1?: Position;
    touch2?: Position;
    touch3?: Position;
    midpoint?: Position;
    centroid?: Position;
    extras?: { [key: string]: Position | undefined };
  };
};

export type GestureHandlers = {
  onWheel: (e: React.WheelEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onImageLoad: () => void;
};

// Math helpers
const radToDeg = (rad: number) => (rad * 180) / Math.PI;
const degToRad = (deg: number) => (deg * Math.PI) / 180;
function normalizeAngleDelta(delta: number): number {
  const PI = Math.PI;
  let d = delta;
  while (d > PI) d -= 2 * PI;
  while (d < -PI) d += 2 * PI;
  return d;
}
function rotateVec(v: Position, rad: number): Position {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

export function useGestureViewer({
  allowRotate = false,
  elastic = false,
  enablePanAtScale1 = false,
  onUpdate,
  debug = false,
}: {
  allowRotate?: boolean;
  elastic?: boolean;
  enablePanAtScale1?: boolean; // when false, single-finger pan at scale=1 is disabled to allow swipe-to-change-image in parent
  onUpdate?: () => void;
  debug?: boolean;
}): {
  imageRef: React.RefObject<HTMLImageElement | null>;
  stateRef: React.RefObject<GestureState>;
  handlers: GestureHandlers;
  resetTransform: () => void;
  computeFitMode: () => void;
} {
  const imageRef = useRef<HTMLImageElement>(null);
  // Timer id is environment-agnostic (number in browser, Timeout in Node typings)
  const zoomTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onUpdateRef = useRef<(() => void) | undefined>(onUpdate);
  onUpdateRef.current = onUpdate;
  const rafId = useRef<number | null>(null);
  const animRafId = useRef<number | null>(null);
  const targetScaleRef = useRef<number | null>(null);
  const targetPosRef = useRef<Position | null>(null);

  const stateRef = useRef<GestureState>({
    scale: 1,
    position: { x: 0, y: 0 },
    rotation: 0,
    dragging: false,
    fitMode: "w",
    isZooming: false,
    pinchZooming: false,
    wheeling: false,
    debugPoints: undefined,
  });

  const lastPosition = useRef<Position>({ x: 0, y: 0 });
  const dragStart = useRef<Position>({ x: 0, y: 0 });
  const lastTouchPosition = useRef<Position>({ x: 0, y: 0 });
  const lastPanPosition = useRef<Position>({ x: 0, y: 0 });
  const needsPanResetAfterPinch = useRef<boolean>(false);

  // Pinch 2-finger vars
  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartScale = useRef<number>(1);
  const pinchStartMidpoint = useRef<Position>({ x: 0, y: 0 });
  const pinchStartPosition = useRef<Position>({ x: 0, y: 0 });
  const pinchStartRotationDeg = useRef<number>(0);
  const pinchIds = useRef<number[]>([]);
  const pinchPrevRawAngle = useRef<number | null>(null);
  const pinchAccumulatedAngle = useRef<number>(0);

  const resetTransform = useCallback(() => {
    const s = stateRef.current;
    // cancel wheel immediate mode
    if (zoomTimeout.current !== null) { clearTimeout(zoomTimeout.current); zoomTimeout.current = null; }
    s.wheeling = false;
    s.isZooming = true;
    s.scale = 1;
    s.position = { x: 0, y: 0 };
    s.rotation = 0;
    // clear any running smooth animation targets
    targetScaleRef.current = null;
    targetPosRef.current = null;
    if (animRafId.current != null) { cancelAnimationFrame(animRafId.current); animRafId.current = null; }
    scheduleApply();
    // end zooming flag after transition
    setTimeout(() => { s.isZooming = false; }, 220);
  }, []);

  const getBaseDisplayedSize = useCallback((): { w: number; h: number } => {
    const img = imageRef.current;
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    if (!img) return { w: containerWidth, h: containerHeight };
    const naturalWidth = img.naturalWidth || 1;
    const naturalHeight = img.naturalHeight || 1;
    if (stateRef.current.fitMode === "w") {
      const w = containerWidth;
      const h = (containerWidth * naturalHeight) / naturalWidth;
      return { w, h };
    } else {
      const h = containerHeight;
      const w = (containerHeight * naturalWidth) / naturalHeight;
      return { w, h };
    }
  }, []);

  const clampPosition = useCallback((next: Position, scaleValue: number, rotationDeg: number): Position => {
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    const { w: baseW, h: baseH } = getBaseDisplayedSize();
    const s = Math.max(0.0001, scaleValue);
    const theta = degToRad(rotationDeg);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const rotW = Math.abs(baseW * s * cos) + Math.abs(baseH * s * sin);
    const rotH = Math.abs(baseW * s * sin) + Math.abs(baseH * s * cos);
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const newCenterX = centerX + next.x;
    const newCenterY = centerY + next.y;
    const left = newCenterX - rotW / 2;
    const right = newCenterX + rotW / 2;
    const top = newCenterY - rotH / 2;
    const bottom = newCenterY + rotH / 2;
    let clampedX = next.x;
    let clampedY = next.y;
    if (left > centerX) clampedX -= (left - centerX);
    if (right < centerX) clampedX += (centerX - right);
    if (top > centerY) clampedY -= (top - centerY);
    if (bottom < centerY) clampedY += (centerY - bottom);
    return { x: clampedX, y: clampedY };
  }, [getBaseDisplayedSize]);

  const computeFitMode = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    if (!naturalWidth || !naturalHeight) return;
    const scaleW = containerWidth / naturalWidth;
    const scaleH = containerHeight / naturalHeight;
    stateRef.current.fitMode = scaleW < scaleH ? "w" : "h";
    onUpdateRef.current?.();
  }, []);

  useLayoutEffect(() => {
    const onResize = () => computeFitMode();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [computeFitMode]);

  const applyTransform = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;
    const s = stateRef.current;
    // keep transform pipeline active while isZooming so transitions to identity (scale=1) animate smoothly
    const needsTransform = s.scale > 1 || s.isZooming || (enablePanAtScale1 && s.dragging) || (allowRotate && s.rotation !== 0);
    if (!needsTransform) {
      // At scale=1 and not panning (or pan disabled), let outer track control movement
      img.style.transition = "";
      img.style.transform = "";
      img.style.transformOrigin = "";
      img.style.willChange = "";
      return;
    }
    // During active drag/pinch -> no transition for immediate response
    const active = s.dragging || s.pinchZooming || s.wheeling;
    img.style.transition = active
      ? "transform 0s"
      : s.isZooming
        ? "transform 0.3s cubic-bezier(0.33, 1, 0.68, 1)"
        : "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)";
    img.style.transform = `translate3d(${s.position.x}px, ${s.position.y}px, 0) scale(${s.scale}) rotate(${s.rotation}deg)`;
    img.style.transformOrigin = "center center";
    img.style.willChange = "transform";
  }, []);

  const scheduleApply = useCallback(() => {
    if (rafId.current != null) return;
    rafId.current = window.requestAnimationFrame(() => {
      rafId.current = null;
      applyTransform();
    });
  }, [applyTransform]);

  // Global safety: ensure dragging state is cleared even if mouseup happens outside the image
  useLayoutEffect(() => {
    const handleGlobalUp = () => {
      if (stateRef.current.dragging) {
        stateRef.current.dragging = false;
        scheduleApply();
      }
    };
    const handleWindowBlur = () => {
      if (stateRef.current.dragging || stateRef.current.pinchZooming) {
        stateRef.current.dragging = false;
        stateRef.current.pinchZooming = false;
        scheduleApply();
      }
    };
    window.addEventListener("mouseup", handleGlobalUp, true);
    window.addEventListener("pointerup", handleGlobalUp, true);
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("mouseup", handleGlobalUp, true);
      window.removeEventListener("pointerup", handleGlobalUp, true);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [scheduleApply]);

  const onImageLoad = useCallback(() => {
    computeFitMode();
    const s = stateRef.current;
    s.position = clampPosition(s.position, s.scale, s.rotation);
    scheduleApply();
  }, [clampPosition, computeFitMode]);

  const getZoomOrigin = (clientX: number, clientY: number) => {
    if (stateRef.current.dragging) {
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    return {
      x: clientX - centerX - stateRef.current.position.x,
      y: clientY - centerY - stateRef.current.position.y,
    };
  };

  const solveAnchoredPosition = (params: {
    startAnchor: Position;
    currAnchor: Position;
    startPosition: Position;
    baseScale: number;
    newScale: number;
    baseRotationDeg: number;
    newRotationDeg: number;
  }): Position => {
    const { startAnchor, currAnchor, startPosition, baseScale, newScale, baseRotationDeg, newRotationDeg } = params;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const r0 = {
      x: startAnchor.x - centerX - startPosition.x,
      y: startAnchor.y - centerY - startPosition.y,
    };
    const k = newScale / baseScale;
    const deltaRad = degToRad(newRotationDeg - baseRotationDeg);
    const rTransformed = rotateVec({ x: r0.x * k, y: r0.y * k }, deltaRad);
    return {
      x: currAnchor.x - centerX - rTransformed.x,
      y: currAnchor.y - centerY - rTransformed.y,
    };
  };

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const s = stateRef.current;
    // compute target scale from wheel delta
    let nextScale = s.scale - e.deltaY * 0.002;
    nextScale = Math.max(1, Math.min(4, nextScale));
    if (Math.abs(nextScale - s.scale) < 1e-4) return;
    // compute anchored target position for this event relative to current state
    const nextPosition = solveAnchoredPosition({
      startAnchor: { x: e.clientX, y: e.clientY },
      currAnchor: { x: e.clientX, y: e.clientY },
      startPosition: s.position,
      baseScale: s.scale,
      newScale: nextScale,
      baseRotationDeg: s.rotation,
      newRotationDeg: s.rotation,
    });
    const clampedTargetPos = clampPosition(nextPosition, nextScale, s.rotation);
    // update smooth targets
    targetScaleRef.current = nextScale;
    targetPosRef.current = clampedTargetPos;
    // treat wheel as active (no CSS transition) during animation
    s.wheeling = true;
    if (zoomTimeout.current !== null) clearTimeout(zoomTimeout.current);
    zoomTimeout.current = setTimeout(() => {
      s.wheeling = false;
      zoomTimeout.current = null;
    }, 120);
    // kick animation loop
    const step = () => {
      animRafId.current = null;
      const s2 = stateRef.current;
      const tScale = targetScaleRef.current;
      const tPos = targetPosRef.current;
      if (tScale == null || !tPos) return;
      // interpolation factor; smaller = smoother
      const alpha = 0.18;
      s2.scale = s2.scale + (tScale - s2.scale) * alpha;
      s2.position = {
        x: s2.position.x + (tPos.x - s2.position.x) * alpha,
        y: s2.position.y + (tPos.y - s2.position.y) * alpha,
      };
      scheduleApply();
      const scaleClose = Math.abs(tScale - s2.scale) < 0.0025;
      const posClose = Math.hypot(tPos.x - s2.position.x, tPos.y - s2.position.y) < 0.8;
      if (!scaleClose || !posClose) {
        animRafId.current = requestAnimationFrame(step);
      }
    };
    if (animRafId.current == null) animRafId.current = requestAnimationFrame(step);
    if (elastic) setTimeout(() => { if (zoomTimeout.current === null) resetTransform(); }, 300);
    e.stopPropagation();
  }, [clampPosition, elastic, resetTransform, scheduleApply]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const s = stateRef.current;
    if (!enablePanAtScale1 && s.scale === 1) return;
    s.dragging = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    lastPosition.current = { ...s.position };
    e.stopPropagation();
  }, [enablePanAtScale1]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const next = { x: lastPosition.current.x + dx, y: lastPosition.current.y + dy };
    s.position = clampPosition(next, s.scale, s.rotation);
    scheduleApply();
    e.stopPropagation();
  }, [clampPosition, scheduleApply]);

  const onMouseUp = useCallback(() => {
    const s = stateRef.current;
    s.dragging = false;
    if (elastic) setTimeout(() => { resetTransform(); }, 300);
  }, [elastic, resetTransform]);

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    const s = stateRef.current;
    // cancel wheel mode to allow CSS transition
    if (zoomTimeout.current !== null) { clearTimeout(zoomTimeout.current); zoomTimeout.current = null; }
    s.wheeling = false;
    s.isZooming = true;
    if (s.scale === 1) {
      const nextScale = 2;
      const nextPos = solveAnchoredPosition({
        startAnchor: { x: e.clientX, y: e.clientY },
        currAnchor: { x: e.clientX, y: e.clientY },
        startPosition: s.position,
        baseScale: s.scale,
        newScale: nextScale,
        baseRotationDeg: s.rotation,
        newRotationDeg: s.rotation,
      });
      s.scale = nextScale;
      s.position = clampPosition(nextPos, nextScale, s.rotation);
    } else {
      // animate back to default with CSS transition
      s.scale = 1;
      s.position = { x: 0, y: 0 };
      s.rotation = 0;
    }
    scheduleApply();
    // allow enough time for the transition in applyTransform (0.2s normal / 0.3s zooming)
    setTimeout(() => { s.isZooming = false; }, 280);
    e.stopPropagation();
  }, [clampPosition, resetTransform, scheduleApply]);

  const angleBetweenTouches = (t1: React.Touch, t2: React.Touch) => {
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return Math.atan2(dy, dx);
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const s = stateRef.current;
    if (e.touches.length === 1) {
      if (needsPanResetAfterPinch.current) {
        lastTouchPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        lastPanPosition.current = { ...s.position };
        needsPanResetAfterPinch.current = false;
      } else {
        lastTouchPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        lastPanPosition.current = { ...s.position };
      }
      s.dragging = enablePanAtScale1 ? true : s.scale > 1;
      s.pinchZooming = false;
      pinchPrevRawAngle.current = null;
      pinchAccumulatedAngle.current = 0;
    } else if (e.touches.length === 2) {
      s.dragging = false;
      s.pinchZooming = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const startDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midpoint = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
      if (debug) {
        s.debugPoints = {
          ...(s.debugPoints || {}),
          touch1: { x: t1.clientX, y: t1.clientY },
          touch2: undefined,
          touch3: undefined,
          midpoint: undefined,
          centroid: undefined,
        };
        onUpdateRef.current?.();
      }
      pinchStartDistance.current = startDistance;
      pinchStartScale.current = s.scale;
      pinchStartMidpoint.current = midpoint;
      pinchStartPosition.current = s.position;
      pinchStartRotationDeg.current = s.rotation;
      needsPanResetAfterPinch.current = true;
      if (allowRotate) {
        pinchIds.current = [t1.identifier, t2.identifier];
        pinchPrevRawAngle.current = angleBetweenTouches(t1, t2);
        pinchAccumulatedAngle.current = 0;
      } else {
        pinchPrevRawAngle.current = null;
        pinchAccumulatedAngle.current = 0;
      }
      if (debug) {
        s.debugPoints = {
          touch1: { x: t1.clientX, y: t1.clientY },
          touch2: { x: t2.clientX, y: t2.clientY },
          touch3: undefined,
          midpoint: midpoint,
          centroid: undefined,
        };
        onUpdateRef.current?.();
      }
    }
    e.stopPropagation();
  }, [allowRotate, enablePanAtScale1, debug]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const s = stateRef.current;
    if (e.touches.length === 1) {
      if (!s.dragging) return;
      const t1 = e.touches[0];
      const dx = t1.clientX - lastTouchPosition.current.x;
      const dy = t1.clientY - lastTouchPosition.current.y;
      const next = { x: lastPanPosition.current.x + dx, y: lastPanPosition.current.y + dy };
      s.position = clampPosition(next, s.scale, s.rotation);
      scheduleApply();
      if (debug) {
        s.debugPoints = {
          ...(s.debugPoints || {}),
          touch1: { x: t1.clientX, y: t1.clientY },
          touch2: undefined,
          touch3: undefined,
          midpoint: undefined,
          centroid: undefined,
        };
        onUpdateRef.current?.();
      }
    } else if (e.touches.length === 2 && pinchStartDistance.current && pinchStartMidpoint.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const currMidpoint = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
      const baseScale = pinchStartScale.current;
      const deltaScale = currDistance / pinchStartDistance.current;
      const newScale = Math.max(1, Math.min(4, baseScale * deltaScale));
      let newRotationDeg = s.rotation;
      if (allowRotate && pinchPrevRawAngle.current !== null) {
        const rawAngle = angleBetweenTouches(t1, t2);
        const prev = pinchPrevRawAngle.current;
        const delta = normalizeAngleDelta(rawAngle - prev);
        pinchAccumulatedAngle.current += delta;
        pinchPrevRawAngle.current = rawAngle;
        newRotationDeg = pinchStartRotationDeg.current + radToDeg(pinchAccumulatedAngle.current);
      } else {
        newRotationDeg = pinchStartRotationDeg.current;
      }
      s.scale = newScale;
      s.rotation = newRotationDeg;
      if (newScale > 1 || baseScale > 1) {
        const nextPos = solveAnchoredPosition({
          startAnchor: pinchStartMidpoint.current,
          currAnchor: currMidpoint,
          startPosition: pinchStartPosition.current,
          baseScale,
          newScale,
          baseRotationDeg: pinchStartRotationDeg.current,
          newRotationDeg,
        });
        s.position = clampPosition(nextPos, newScale, newRotationDeg);
      } else {
        // keep centered at scale=1 so that outer swiper controls movement
        s.position = { x: 0, y: 0 };
      }
      scheduleApply();
      if (debug) {
        s.debugPoints = {
          touch1: { x: t1.clientX, y: t1.clientY },
          touch2: { x: t2.clientX, y: t2.clientY },
          touch3: undefined,
          midpoint: currMidpoint,
          centroid: undefined,
        };
        onUpdateRef.current?.();
      }
    }
    e.stopPropagation();
  }, [allowRotate, clampPosition, scheduleApply, debug]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const s = stateRef.current;
    if (e.touches.length === 1) {
      // Seamlessly hand off from pinch (2 fingers) to pan (1 finger)
      const t1 = e.touches[0];
      lastTouchPosition.current = { x: t1.clientX, y: t1.clientY };
      lastPanPosition.current = { ...s.position };
      needsPanResetAfterPinch.current = false;
      // Clear pinch trackers and start panning immediately if allowed
      pinchStartDistance.current = null;
      pinchPrevRawAngle.current = null;
      pinchAccumulatedAngle.current = 0;
      s.pinchZooming = false;
      s.dragging = enablePanAtScale1 ? true : s.scale > 1;
      scheduleApply();
      if (debug) {
        s.debugPoints = {
          ...(s.debugPoints || {}),
          touch1: { x: t1.clientX, y: t1.clientY },
          touch2: undefined,
          touch3: undefined,
          midpoint: undefined,
          centroid: undefined,
        };
        onUpdateRef.current?.();
      }
    } else if (e.touches.length === 0) {
      pinchStartDistance.current = null;
      pinchPrevRawAngle.current = null;
      pinchAccumulatedAngle.current = 0;
      s.dragging = false;
      s.pinchZooming = false;
      if (elastic) setTimeout(() => { resetTransform(); }, 300);
      scheduleApply();
      if (debug) {
        s.debugPoints = {};
        onUpdateRef.current?.();
      }
    }
    e.stopPropagation();
  }, [elastic, resetTransform, scheduleApply, debug]);

  return {
    imageRef,
    stateRef,
    handlers: {
      onWheel,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onDoubleClick,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onImageLoad,
    },
    resetTransform,
    computeFitMode,
  };
}
