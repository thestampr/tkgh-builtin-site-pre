"use client";

import { useDevice } from "@/hooks/useDevice";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, AlertTriangle, Info } from "lucide-react";
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
export type ToastPositionDesktop =
  | "top"
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
export type ToastPositionMobile = "top" | "center" | "bottom";
type ToastBasePosition = ToastPositionDesktop | ToastPositionMobile;

export interface ToastOptions {
  id?: string;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  duration?: number;
  position?: ToastBasePosition;
  style?: React.CSSProperties;
  className?: string;
  content?: ReactNode;
  /**
   * Click handler for the toast.
   */
  onClick?: () => void;
  /**
   * Whether the toast should be pinned (i.e., not dismissed automatically).
   */
  pin?: boolean;
  /**
   * Whether the toast can be dismissed by the user.
   */
  dismissible?: boolean;
}

export interface ToastContextProps {
  showToast: (options: ToastOptions) => string;
  showSuccessToast: (options: ToastOptions) => string;
  showErrorToast: (options: ToastOptions) => string;
  showInfoToast: (options: ToastOptions) => string;
  showWarningToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  setToastZIndex: (zIndex: number) => void;
  resetToastZIndex: () => void;
}

const DEFAULT_TOAST_DURATION = 5000;
const DEFAULT_TOAST_POSITION: ToastBasePosition = "bottom-right";
const DEFAULT_TOAST_Z_INDEX = 9999;

interface ToastInstance extends ToastOptions {
  id: string;
  expiresAt: number;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Get default position according to device type
function getDefaultPosition(deviceType: string): ToastBasePosition {
  if (deviceType === "mobile") return "bottom";
  return "bottom-right";
}

// Determine stack direction for each position
function getStackDirection(position: ToastBasePosition): "down" | "center" | "up" {
  const topPositions: ToastBasePosition[] = [
    "top-left",
    "top-center",
    "top-right",
    "top",
  ];
  const centerPositions: ToastBasePosition[] = [
    "center-left",
    "center",
    "center-right",
    "center",
  ];
  const bottomPositions: ToastBasePosition[] = [
    "bottom-left",
    "bottom-center",
    "bottom-right",
    "bottom",
  ];
  if (topPositions.includes(position)) return "down";
  if (centerPositions.includes(position)) return "center";
  if (bottomPositions.includes(position)) return "up";
  return "up";
}

// Position class for each stack
const positionClass = (pos: ToastBasePosition, deviceType: string) => {
  const base =
    "fixed w-full max-w-sm pointer-events-none p-4 flex flex-col";
  if (deviceType === "mobile") {
    if (pos === "top" || pos.startsWith("top-"))
      return `${base} top-2 left-0 right-0 items-center`;
    if (pos === "center" || pos.startsWith("center-"))
      return `${base} top-1/2 left-0 right-0 -translate-y-1/2 items-center justify-center`;
    return `${base} bottom-2 left-0 right-0 items-center`;
  }
  const positions: Record<ToastPositionDesktop, string> = {
    "top": `${base} top-4 left-1/2 -translate-x-1/2 items-center`,
    "top-left": `${base} top-4 left-4 items-start`,
    "top-center": `${base} top-4 left-1/2 -translate-x-1/2 items-center`,
    "top-right": `${base} top-4 right-4 items-end`,
    "center-left": `${base} top-1/2 -translate-y-1/2 left-4 items-start justify-center`,
    "center": `${base} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center`,
    "center-right": `${base} top-1/2 -translate-y-1/2 right-4 items-end justify-center`,
    "bottom": `${base} bottom-4 left-1/2 -translate-x-1/2 items-center`,
    "bottom-left": `${base} bottom-4 left-4 items-start`,
    "bottom-center": `${base} bottom-4 left-1/2 -translate-x-1/2 items-center`,
    "bottom-right": `${base} bottom-4 right-4 items-end`
  };
  return positions[pos as ToastPositionDesktop] || positions[DEFAULT_TOAST_POSITION];
};

// Animation for each toast (slide and fade in/out)
function getToastVariants(pos: ToastBasePosition) {
  const dir = getStackDirection(pos);
  if (dir === "up" || dir === "center") {
    // Center and bottom: fade up
    return {
      initial: { opacity: 0, y: 32, scale: 0.96 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -32, scale: 0.96, transition: { duration: 0.25 } },
    };
  }
  if (dir === "down") {
    // Top: fade down
    return {
      initial: { opacity: 0, y: -32, scale: 0.96 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 32, scale: 0.96, transition: { duration: 0.25 } },
    };
  }
  // fallback
  return {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.25 } },
  };
}

// Style for toast on mobile (full width with safe margin)
function toastOuterStyle(deviceType: string): React.CSSProperties {
  if (deviceType === "mobile") {
    return {
      width: "100vw",
      maxWidth: "100vw",
      minWidth: "0",
      boxSizing: "border-box",
      paddingLeft: 14,
      paddingRight: 14,
      paddingTop: 72,
      paddingBottom: 72,
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
  defaultPosition?: ToastBasePosition;
  defaultzIndex?: number;
}

export function ToastProvider({ 
  children,
  defaultDuration,
  defaultPosition,
  defaultzIndex
}: ToastProviderProps) {
  const { deviceType } = useDevice();

  const [toasts, setToasts] = useState<ToastInstance[]>([]);
  const timeouts = useRef<{ [id: string]: NodeJS.Timeout }>({});
  const [toastZIndex, setToastZIndex] = useState(defaultzIndex || DEFAULT_TOAST_Z_INDEX);

  // Show toast
  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = options.id || generateId();
      const duration = options.duration ?? defaultDuration ?? DEFAULT_TOAST_DURATION;
      const position = options.position ?? defaultPosition ?? getDefaultPosition(deviceType);
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
        return [...prev, { ...options, id, expiresAt, position, pin, dismissible }];
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
  function getSortedToasts(pos: ToastBasePosition, items: ToastInstance[]) {
    // Pinned toasts always on top
    const pinned = items.filter(t => t.pin);
    const unpinned = items.filter(t => !t.pin);

    const dir = getStackDirection(pos);
    const sortFn: (a: ToastInstance, b: ToastInstance) => number = dir === "down"
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
      removeToast, 
      setToastZIndex, 
      resetToastZIndex 
    }}>
      {children}
      {Object.entries(grouped).map(([pos, items]) => {
        const position = pos as ToastBasePosition;
        const sorted = getSortedToasts(position, items);
        const stackStyle =
          getStackDirection(position) === "center"
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
              {sorted.map((t, idx) => (
                <motion.div
                  key={t.id}
                  layout
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  data-ripple
                  variants={getToastVariants(position)}
                  transition={{ type: "spring", bounce: 0.25, duration: 0.35 }}
                  className={clsx(
                    "**:select-none",
                    "px-4 py-3 mb-4 flex gap-3 items-center",
                    "bg-white dark:bg-neutral-900 shadow-lg rounded-lg border border-neutral-200 dark:border-neutral-800",
                    t.className || "",
                    t.onClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800" : ""
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
                    {t.content && <div className="mt-1 text-sm">{t.content}</div>}
                  </div>
                  {t.actions && (
                    <div className="flex-shrink-0 ml-3">{t.actions}</div>
                  )}
                  {t.dismissible && (
                    <button
                      className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                      onClick={() => removeToast(t.id)}
                      aria-label="Logout"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              ))}
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