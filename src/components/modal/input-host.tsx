"use client";
import React, { useEffect, useRef, useState } from "react";
import Modal, { openModal, closeModal } from ".";

export type InputPayload = {
  title?: string;
  message?: string;
  placeholder?: string;
  initialValue?: string;
  confirmText?: string;
  cancelText?: string;
  autoFocus?: boolean;
  modifier?: (v: string) => string;
};

export default function InputHost() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [payload, setPayload] = useState<InputPayload | null>(null);
  const [val, setVal] = useState("");
  const resolverRef = useRef<((v: string | null) => void) | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<InputPayload & { resolve: (v: string | null) => void }>;
      resolverRef.current = ce.detail.resolve;
      setPayload({
        title: ce.detail.title ?? "Input",
        message: ce.detail.message ?? "",
        placeholder: ce.detail.placeholder ?? "",
        initialValue: ce.detail.initialValue ?? "",
        confirmText: ce.detail.confirmText ?? "OK",
        cancelText: ce.detail.cancelText ?? "Cancel",
        autoFocus: ce.detail.autoFocus ?? true,
        modifier: ce.detail.modifier,
      });
      setVal(ce.detail.initialValue ?? "");
      openModal("global-input");
    };
    window.addEventListener("app:input", handler as EventListener);
    return () => window.removeEventListener("app:input", handler as EventListener);
  }, []);

  const resolveAndClose = (value: string | null) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    closeModal("global-input");
    setTimeout(() => setPayload(null), 300);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (payload?.modifier) {
      setVal(payload.modifier(newValue));
    } else {
      setVal(newValue);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    switch (e.key) {
      case "Enter":
        resolveAndClose(val);
        break;
      case "Escape":
        resolveAndClose(null);
        break;
    }
  }

  const onOpen = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }

  const onClose = () => {
    resolveAndClose(null);
  }

  return (
    <Modal name="global-input" title={payload?.title} description={payload?.message} onOpen={onOpen} onClose={onClose}>
      <div className="space-y-4">
        <input
          ref={inputRef}
          className="w-full border rounded px-3 py-2 border-[var(--border)] bg-[var(--surface)]"
          placeholder={payload?.placeholder}
          value={val}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost rounded-lg border border-[var(--border)]" onClick={() => resolveAndClose(null)}>
            {payload?.cancelText ?? "Cancel"}
          </button>
          <button className="btn btn-primary" onClick={() => resolveAndClose(val)} disabled={val.trim() === ""}>
            {payload?.confirmText ?? "OK"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
