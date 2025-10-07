"use client";

import { useDevice } from "@/hooks/useDevice";
import clsx from "clsx";
import type { Variants } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Position types
enum PositionVerticalEnum {
  top = "top", 
  center = "center", 
  bottom = "bottom"
};
enum PositionHorizontalEnum { 
  left = "left", 
  right = "right" 
};
const verticals = Object.values(PositionVerticalEnum);
const horizontals = Object.values(PositionHorizontalEnum);

type PositionVertical = typeof verticals[number];
type PositionHorizontal = typeof horizontals[number];
type Position = `${PositionVertical}` | `${PositionHorizontal}` | `${PositionVertical}-${PositionHorizontal}`;
export type PositionDesktop = Position;
export type PositionMobile = `${PositionVertical}`;
const positions: Position[] = [
  ...verticals,
  ...verticals.flatMap(v => horizontals.map(h => `${v}-${h}` as const))
];

// Direction types
const directions = ["up", "down", "left", "right"] as const;
type DirectionType = typeof directions[number];
export type Direction = `${DirectionType}` | `${DirectionType}-${DirectionType}` | "none";

export interface ToastOptions {
  /** Optional ID for the toast. If not provided, a random ID will be generated. */
  id?: string;
  /** Toast title */
  title?: ReactNode;
  /** Toast message */
  description?: ReactNode;
  /** Leading node on the left, AKA Toast icon */
  icon?: ReactNode;
  /** Trailing node on the right, AKA Actions */
  actions?: ReactNode;
  /** Custom content for the toast, if you want to render more complex content. */
  content?: ReactNode;
  /** Duration in milliseconds before the toast is dismissed. Default is 5000 (5 seconds). Set to 0 to disable auto-dismiss. */
  duration?: number;
  /** Position of the toast on the screen. Default is "bottom-right" on desktop and "bottom" on mobile. */
  position?: Position;
  /** Toast animation variants. If not provided, it will be determined by the position. */
  direction?: Direction;
  /** Custom styles for the toast container */
  style?: React.CSSProperties;
  /** Custom class name for the toast container */
  className?: string;
  /** Click handler for the toast. */
  onClick?: () => void;
  /** Whether the toast should be pinned (i.e., high priority in the stack). */
  pin?: boolean;
  /** Whether the toast can be dismissed by the user. the close button will be shown if true */
  dismissible?: boolean;
}

export interface ToastContextProps {
  showToast: (options: ToastOptions) => string;
  showSuccessToast: (options: ToastOptions) => string;
  showErrorToast: (options: ToastOptions) => string;
  showInfoToast: (options: ToastOptions) => string;
  showWarningToast: (options: ToastOptions) => string;
  updateToast: (id: string, options: Partial<ToastOptions>) => void;
  removeToast: (id: string) => void;
  setToastZIndex: (zIndex: number) => void;
  resetToastZIndex: () => void;
}

const DEFAULT_TOAST_DURATION = 5000;
const DEFAULT_TOAST_POSITION: Position = "bottom-right";
const DEFAULT_TOAST_Z_INDEX = 9999;

interface ToastInstance extends ToastOptions {
  id: string;
  expiresAt: number;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

// Get default position according to device type
function getDefaultPosition(deviceType: string): Position {
  if (deviceType === "mobile") {
    const [v, _] = DEFAULT_TOAST_POSITION.split("-") as [PositionVertical, PositionHorizontal?];
    return v;
  }
  return DEFAULT_TOAST_POSITION;
}

function getAllEmptyToasts(): ToastInstance[] {
  const toasts: ToastInstance[] = [];
  positions.forEach(pos => {
    toasts.push({
      id: `__emptyToast-${pos}`,
      position: pos,
      expiresAt: 0,
      pin: true,
      dismissible: false,
    });
  });
  return toasts;
}

// Determine stack direction for each position
function getStackDirection(position: Position): Direction {
  if (position === "top") return "down";
  if (position === "bottom") return "up";
  if (position === "top-left") return "right-down";
  if (position === "top-right") return "left-down";

  const leftUpPositions: Position[] = [
    "left",
    "center-left",
    "bottom-left",
  ];
  const rightUpPositions: Position[] = [
    "right",
    "center-right",
    "bottom-right"
  ];

  if (leftUpPositions.includes(position)) return "right-up";
  if (rightUpPositions.includes(position)) return "left-up";
  return "none";
}

// Ensure device-specific position is valid
function ensureDevicePosition(pos: Position, deviceType: string): Position {
  if (deviceType === "mobile") {
    const topPositions: Position[] = [ "top-left", "top-right" ];
    if (topPositions.includes(pos)) return "top" as PositionMobile;
    const centerPositions: Position[] = [ "left", "right", "center-left", "center-right" ];
    if (centerPositions.includes(pos)) return "center" as PositionMobile;
    const bottomPositions: Position[] = [ "bottom-left", "bottom-right" ];
    if (bottomPositions.includes(pos)) return "bottom" as PositionMobile;
  }
  return pos;
}

// Position class for each stack
function positionClass(pos: Position, deviceType: string) {
  const base = "fixed w-full max-w-sm pointer-events-none p-4 flex flex-col";

  if (deviceType === "mobile") {
    if (pos === "top" || pos.startsWith("top-"))
      return `${base} top-2 left-0 right-0 items-center`;
    if (pos === "center" || pos.startsWith("center-"))
      return `${base} top-1/2 left-0 right-0 -translate-y-1/2 items-center justify-center`;
    return `${base} bottom-2 left-0 right-0 items-center`;
  }
  const positions: Record<PositionDesktop, string> = {
    "top": `${base} top-4 left-1/2 -translate-x-1/2 items-center`,
    "top-left": `${base} top-4 left-4 items-start`,
    "top-right": `${base} top-4 right-4 items-end`,
    "left": `${base} top-1/2 -translate-y-1/2 left-4 items-start justify-center`,
    "center-left": `${base} top-1/2 -translate-y-1/2 left-4 items-start justify-center`,
    "center": `${base} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center`,
    "right": `${base} top-1/2 -translate-y-1/2 right-4 items-end justify-center`,
    "center-right": `${base} top-1/2 -translate-y-1/2 right-4 items-end justify-center`,
    "bottom": `${base} bottom-4 left-1/2 -translate-x-1/2 items-center`,
    "bottom-left": `${base} bottom-4 left-4 items-start`,
    "bottom-right": `${base} bottom-4 right-4 items-end`
  };
  return positions[pos as PositionDesktop] || positions[DEFAULT_TOAST_POSITION];
};

// Animation for each toast (slide and fade in/out)
function getToastVariants(dir: Direction): Variants {
  const [_start, _end] = dir.split("-");
  const start = _start as Direction;
  const end = _end ?? start as Direction;
  let variants: Variants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.25 } },
  };

  switch (start) {
    case "up":
      variants.initial = { opacity: 0, y: 32, scale: 0.96 };
      variants.animate = { opacity: 1, y: 0, scale: 1 };
      break;
    case "down":
      variants.initial = { opacity: 0, y: -32, scale: 0.96 };
      variants.animate = { opacity: 1, y: 0, scale: 1 };
      break;
    case "left":
      variants.initial = { opacity: 0, x: 32, scale: 0.96 };
      variants.animate = { opacity: 1, x: 0, scale: 1 };
      break;
    case "right":
      variants.initial = { opacity: 0, x: -32, scale: 0.96 };
      variants.animate = { opacity: 1, x: 0, scale: 1 };
      break;
    default:
      break;
  }
  

  switch (end) {
    case "down":
      variants.exit = { opacity: 0, y: 32, scale: 0.96, transition: { duration: 0.25 } };
      break;
    case "up":
      variants.exit = { opacity: 0, y: -32, scale: 0.96, transition: { duration: 0.25 } };
      break;
    case "left":
      variants.exit = { opacity: 0, x: -32, scale: 0.96, transition: { duration: 0.25 } };
      break;
    case "right":
      variants.exit = { opacity: 0, x: 32, scale: 0.96, transition: { duration: 0.25 } };
      break;
    default:
      break;
  }

  return variants;
}

// Style for toast on mobile (full width with safe margin)
function toastOuterStyle(deviceType: string): React.CSSProperties {
  if (deviceType === "mobile") {
    return {
      width: "100vw",
      maxWidth: "100vw",
      minWidth: "0",
      boxSizing: "border-box",
      paddingLeft: 18,
      paddingRight: 18,
      paddingTop: 18,
      paddingBottom: 18,
    };
  }
  return {};
}
function toastInnerStyle(deviceType: string): React.CSSProperties {
  if (deviceType === "mobile") {
    return {
      width: "100%",
      maxWidth: 480,
      minWidth: 0,
      marginLeft: "auto",
      marginRight: "auto",
      borderRadius: 12,
    };
  }
  return {};
}

interface ToastProviderProps {
  children: ReactNode;
  defaultDuration?: number;
  defaultPosition?: Position;
  defaultDirection?: Direction;
  defaultzIndex?: number;
}

export function ToastProvider({ 
  children,
  defaultDuration,
  defaultPosition,
  defaultDirection,
  defaultzIndex
}: ToastProviderProps) {
  const { deviceType } = useDevice();

  const [toasts, setToasts] = useState<ToastInstance[]>(getAllEmptyToasts());
  const timeouts = useRef<{ [id: string]: NodeJS.Timeout }>({});
  const [toastZIndex, setToastZIndex] = useState(defaultzIndex || DEFAULT_TOAST_Z_INDEX);

  // Show toast
  const showToast = useCallback(
    (options: ToastOptions) => {
      if (options.position === "left") options.position = "center-left";
      if (options.position === "right") options.position = "center-right";

      const id = options.id || generateId();
      const duration = options.duration ?? defaultDuration ?? DEFAULT_TOAST_DURATION;
      const position = ensureDevicePosition(
        options.position ?? defaultPosition ?? getDefaultPosition(deviceType), 
        deviceType
      );
      const direction = options.direction ?? defaultDirection ?? getStackDirection(position);
      const pin = options.pin ?? false;
      const dismissible = options.dismissible ?? true;

      setToasts((prev) => {
        const now = Date.now();
        const exists = prev.find((t) => t.id === id);
        const expiresAt = now + duration;
        if (exists) {
          return prev.map((t) =>
            t.id === id ? { ...t, ...options, expiresAt } : t
          );
        }
        return [...prev, { ...options, id, expiresAt, position, direction, pin, dismissible }];
      });

      if (!pin) {
        if (timeouts.current[id]) clearTimeout(timeouts.current[id]);
        timeouts.current[id] = setTimeout(() => removeToast(id), duration);
      }

      return id;
    },
    [deviceType]
  );

  // Show toast helpers
  const showSuccessToast = useCallback((options: ToastOptions) => {
    return showToast({ ...options, icon: <Check className="w-5 h-5 text-accent" /> });
  }, [showToast]);

  const showErrorToast = useCallback((options: ToastOptions) => {
    return showToast({ ...options, icon: <X className="w-5 h-5 text-danger" /> });
  }, [showToast]);

  const showInfoToast = useCallback((options: ToastOptions) => {
    return showToast({ ...options, icon: <Info className="w-5 h-5 text-info" /> });
  }, [showToast]);

  const showWarningToast = useCallback((options: ToastOptions) => {
    return showToast({ ...options, icon: <AlertTriangle className="w-5 h-5 text-warning" /> });
  }, [showToast]);
  
  // Update toast
  const updateToast = (id: string, options: Partial<ToastOptions>) => {
    const exists = toasts.find((t) => t.id === id);
    if (!exists) return;
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...options } : t)));
  };

  // Remove toast
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timeouts.current[id]) {
      clearTimeout(timeouts.current[id]);
      delete timeouts.current[id];
    }
  }, []);

  // Toast provider helpers
  const resetToastZIndex = useCallback(() => {
    setToastZIndex(defaultzIndex || DEFAULT_TOAST_Z_INDEX);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(timeouts.current).forEach(clearTimeout);
    };
  }, []);

  // Group by position
  const grouped = toasts.reduce<{ [pos: string]: ToastInstance[] }>((acc, t) => {
    acc[t.position || getDefaultPosition(deviceType)] =
      acc[t.position || getDefaultPosition(deviceType)] || [];
      acc[t.position || getDefaultPosition(deviceType)].push(t);
    return acc;
  }, {});

  // Sort toast for each position according to stack direction
  function getSortedToasts(pos: Position, items: ToastInstance[]) {
    // Pinned toasts always on top
    const pinned = items.filter(t => t.pin);
    const unpinned = items.filter(t => !t.pin);

    const dir = getStackDirection(pos);
    const sortFn: (a: ToastInstance, b: ToastInstance) => number = dir.includes("down")
      ? (a, b) => b.expiresAt - a.expiresAt // Newest on top
      : (a, b) => a.expiresAt - b.expiresAt; // Newest on bottom

    if (dir === "up") return [
      ...unpinned.sort(sortFn),
      ...pinned.sort(sortFn)
    ];

    return [
      ...pinned.sort(sortFn),
      ...unpinned.sort(sortFn)
    ];
  }

  return (
    <ToastContext.Provider value={{ 
      showToast, 
      showSuccessToast, 
      showErrorToast, 
      showInfoToast, 
      showWarningToast,
      updateToast, 
      removeToast, 
      setToastZIndex, 
      resetToastZIndex 
    }}>
      {children}
      {Object.entries(grouped).map(([pos, items]) => {
        const position = pos as Position;
        const sorted = getSortedToasts(position, items);
        const stackDirection = getStackDirection(position);
        const stackStyle = stackDirection  === "none"
          ? { justifyContent: "center", minHeight: 160 }
          : {};
        return (
          <div
            key={pos}
            className={clsx(
              positionClass(position, deviceType),
              "flex gap-1"
            )}
            style={{ 
              pointerEvents: "none", 
              zIndex: toastZIndex,
              ...stackStyle, 
              ...toastOuterStyle(deviceType) 
            }}
          >
            <AnimatePresence initial={true}>
              {sorted.map((t, idx) => {
                const isEmptyToast = t.id.startsWith("__emptyToast-");

                return <motion.div
                  key={t.id}
                  layout
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  data-ripple
                  variants={getToastVariants(t.direction ?? stackDirection)}
                  transition={{ 
                    type: "spring", 
                    bounce: 0.25, 
                    duration: 0.35 
                  }}
                  className={clsx(
                    "**:select-none",
                    "px-4 py-3 mb-4 flex gap-3 items-center flex-[0_0_100%]",
                    "bg-white dark:bg-neutral-900 shadow-lg rounded-lg border border-neutral-200 dark:border-neutral-800",
                    t.className || "",
                    t.onClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800" : "",
                    isEmptyToast && "!hidden",
                  )}
                  style={{
                    minWidth: deviceType === "mobile" ? 0 : 400,
                    maxWidth: deviceType === "mobile" ? 480 : 400,
                    ...t.style,
                    ...toastInnerStyle(deviceType),
                    pointerEvents: "auto",
                    marginBottom: 0,
                  }}
                  tabIndex={-1}
                  onClick={t.onClick}
                  onMouseEnter={() => {
                    if (t.pin) return;
                    if (timeouts.current[t.id]) {
                      clearTimeout(timeouts.current[t.id]);
                      delete timeouts.current[t.id];
                    }
                  }}
                  onMouseLeave={() => {
                    if (t.pin) return;
                    if (!timeouts.current[t.id]) {
                      timeouts.current[t.id] = setTimeout(
                        () => removeToast(t.id),
                        t.expiresAt - Date.now()
                      );
                    }
                  }}
                >
                  { isEmptyToast 
                    ? t.position
                    : (
                      <>
                        {t.icon && <div className="flex-shrink-0">{t.icon}</div>}
                        <div className="flex flex-col flex-1 min-w-0 gap-1">
                          {t.title && (
                            <div className="font-medium text-sm truncate">
                              {t.title}
                            </div>
                          )}
                          {t.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {t.description}
                            </div>
                          )}
                          {t.content && <div className={clsx(
                            "text-sm",
                            (t.title || t.description) && "mt-1",
                          )}>{t.content}</div>}
                        </div>
                        {t.actions && (
                          <div className="flex-shrink-0 ml-3">{t.actions}</div>
                        )}
                        {t.dismissible && (
                          <button
                            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0"
                            onClick={() => removeToast(t.id)}
                            aria-label="Logout"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )
                  }
                </motion.div>
              })}
            </AnimatePresence>
          </div>
        );
      })}
    </ToastContext.Provider>
  );
}

// Hook
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}