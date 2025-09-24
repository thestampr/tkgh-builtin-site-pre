"use client";

import React from "react";

interface ModalShellProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const ModalShell: React.FC<ModalShellProps> = ({ open, title, onClose, children, footer, className = "" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-3xl bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden ${className}`}>
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="btn btn-ghost !px-3 !border-0">✕</button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-sm">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/60">{footer}</div>
        )}
      </div>
    </div>
  );
};
