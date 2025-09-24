"use client";
import React, { useEffect, useRef, useState } from "react";
import Modal, { openModal, closeModal } from ".";
import clsx from "clsx";

type ConfirmPayload = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

export default function ConfirmHost() {
  const [payload, setPayload] = useState<ConfirmPayload | null>(null);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<ConfirmPayload & { resolve: (v: boolean) => void }>;
      resolverRef.current = ce.detail.resolve;
      setPayload({
        title: ce.detail.title ?? "Confirm",
        message: ce.detail.message,
        confirmText: ce.detail.confirmText ?? "Confirm",
        cancelText: ce.detail.cancelText ?? "Cancel",
        danger: ce.detail.danger ?? true,
      });
      openModal("global-confirm");
    };
    window.addEventListener("app:confirm", handler as EventListener);
    return () => window.removeEventListener("app:confirm", handler as EventListener);
  }, []);

  const resolveAndClose = (val: boolean) => {
    resolverRef.current?.(val);
    resolverRef.current = null;
    closeModal("global-confirm");
    // keep payload so animation can close smoothly; clear a tick later
    setTimeout(() => setPayload(null), 300);
  };

  return (
    <Modal name="global-confirm" 
      title={payload?.title} 
      description={payload?.message}
      onClose={() => resolveAndClose(false)}
    >
      <div className="flex justify-end gap-2">
        <button className="btn btn-ghost rounded-lg border border-[var(--border)]" onClick={() => resolveAndClose(false)}>
          {payload?.cancelText ?? "Cancel"}
        </button>
        <button className={clsx(
          "btn",
          payload?.danger ? "btn-danger" : "btn-primary"
        )} onClick={() => resolveAndClose(true)}>
          {payload?.confirmText ?? "Confirm"}
        </button>
      </div>
    </Modal>
  );
}
