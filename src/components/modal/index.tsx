"use client";

import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import clsx from "clsx";
import { Fragment, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ModalBarrier from "./modal-barrier";
import "./style.css";

const OPEN_EVENT = "modal:open";
const CLOSE_EVENT = "modal:close";

type ModalProps = {
  name: string;
  onOpen?: () => void;
  onClose?: () => void;
  title?: string;
  description?: string;
  className?: string;
  children: ReactNode;
  showBarrier?: boolean;
  barrierDismissible?: boolean;
  zIndex?: number;
};

export default function Modal({
  name,
  onOpen,
  onClose,
  title,
  description,
  className = "",
  children,
  showBarrier = true,
  barrierDismissible = true,
  zIndex = 70,
}: ModalProps) {
  // Local uncontrolled open state
  const [open, setOpen] = useState(false);

  // Stable callbacks with latest closures
  const openLocal = useCallback(() => {
    if (open) return;
    setOpen(true);
    onOpen?.();
  }, [open, onOpen]);

  const close = useCallback(() => {
    if (!open) return;
    setOpen(false);
    onClose?.();
  }, [open, onClose]);

  // Keep refs to latest functions to avoid stale closures inside global listeners
  const openRef = useRef<() => void>(() => {});
  const closeRef = useRef<() => void>(() => {});
  useEffect(() => {
    openRef.current = openLocal;
  }, [openLocal]);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);

  // Programmatic open via window event
  useEffect(() => {
    if (!name) return;
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ name?: string }>;
      if (ce.detail?.name === name) {
        try {
          openRef.current();
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          console.error("Modal open error:", message);
        }
      }
    };
    window.addEventListener(OPEN_EVENT, handler as EventListener);
    return () => window.removeEventListener(OPEN_EVENT, handler as EventListener);
  }, [name]);

  // Programmatic close via window event
  useEffect(() => {
    if (!name) return;
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ name?: string }>;
      if (ce.detail?.name === name) {
        try {
          closeRef.current();
        } finally {
        }
      }
    };
    window.addEventListener(CLOSE_EVENT, handler as EventListener);
    return () => window.removeEventListener(CLOSE_EVENT, handler as EventListener);
  }, [name]);

  // Delegated triggers via data-modal-trigger and data-modal-sheet-trigger
  useEffect(() => {
    if (!name) return;

    const matchesTrigger = (el: Element | null): boolean => {
      if (!el) return false;
      const value = (el as HTMLElement).getAttribute("data-modal-trigger");
      const sheetValue = (el as HTMLElement).getAttribute("data-modal-sheet-trigger");
      return (!!value && value === name) || (!!sheetValue && sheetValue === name);
    };

    const handleOpenRequest = (e: Event) => {
      e.preventDefault();
      openRef.current();
    };

    const onDocumentClick = (e: MouseEvent) => {
      let el: Element | null = (e.target as Element) || null;
      while (el && el !== document.documentElement) {
        if (matchesTrigger(el)) {
          handleOpenRequest(e);
          break;
        }
        el = el.parentElement;
      }
    };

    const onDocumentKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          closeRef.current();
          break;
        case "Enter":
        case " ":
          {
            let el: Element | null = (e.target as Element) || null;
            while (el && el !== document.documentElement) {
              if (matchesTrigger(el)) {
                handleOpenRequest(e);
                break;
              }
              el = el.parentElement;
            }
          }
          break;
      }
    };

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onDocumentKeyDown);
    return () => {
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onDocumentKeyDown);
    };
  }, [name]);

  // Determine Dialog onClose behavior based on barrierDismissible
  const dialogOnClose = barrierDismissible ? (() => closeRef.current()) : () => {};

  // Create or get a dedicated portal root under body
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (typeof document === "undefined") return;

    let root = document.getElementById("modal-portal-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "modal-portal-root";
      document.body.appendChild(root);
    }

    // Ensure the root itself does not create any layout box
    // This avoids reserving space under <body>.
    root.style.display = "contents";

    setModalRoot(root);
  }, []);

  const modalContent = (
    <>
      {/* Use default unmount behavior so nothing remains in layout when closed */}
      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" onClose={dialogOnClose}
          className="fixed inset-0 flex items-center justify-center p-6"
          style={{ zIndex }}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel
              className={clsx(
                "modal-panel",
                "max-h-full overflow-y-scroll no-scrollbar bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] rounded-3xl shadow-lg p-4",
                "w-full md:min-w-md md:w-fit lg:w-xl lg:max-w-2xl",
                className
              )}
            >
              {(title || description) && (
                <DialogTitle as="div" className="modal-header mb-6">
                  {title && <h2 className="text-2xl font-bold text-[var(--foreground)]">{title}</h2>}
                  {description && <p className="text-sm text-[var(--foreground)] opacity-70 mt-2">{description}</p>}
                </DialogTitle>
              )}

              <div className="modal-body">{children}</div>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>

      {/* Only mount barrier when open to avoid any layout or paint artifacts */}
      {showBarrier && (
        <ModalBarrier
          zIndex={zIndex - 1}
          show={open}
          closeTrigger={barrierDismissible ? () => closeRef.current() : undefined}
          barrierDismissible={barrierDismissible}
          theme="dark"
        />
      )}
    </>
  );

  // Render into body via portal once modalRoot is available (client only)
  if (!modalRoot) return null;

  return createPortal(modalContent, modalRoot);
}

// Utility to programmatically open Modal by name
export function openModal(name: string) {
  if (typeof window === "undefined") return;
  const event = new CustomEvent<{ name: string }>(OPEN_EVENT, {
    detail: { name },
  });
  window.dispatchEvent(event);
}

// Utility to programmatically close Modal by name
export function closeModal(name: string) {
  if (typeof window === "undefined") return;
  const event = new CustomEvent<{ name: string }>(CLOSE_EVENT, {
    detail: { name },
  });
  window.dispatchEvent(event);
}