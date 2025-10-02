"use client";

import { ModalShell } from "@/components/common/ModalShell";
import { useTranslations } from "next-intl";
import React from "react";
import type { EstimateDto } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  estimate: EstimateDto | null;
  onMarkViewed: (id: string) => void;
}

export const EstimateDetailModal: React.FC<Props> = ({ open, onClose, estimate, onMarkViewed }) => {
  if (!estimate) return null;

  const t = useTranslations("ProviderEstimates");

  return (
    <ModalShell
      open={open}
      title={t("view")}
      onClose={onClose}
      footer={<div className="flex items-center gap-3 w-full justify-end">
        {!estimate.viewed && (
          <button
            onClick={() => { onMarkViewed(estimate.id); }}
            className="btn btn-secondary"
          >{t("markViewed")}</button>
        )}
        <button onClick={onClose} className="btn btn-ghost">{t("close")}</button>
      </div>}
      className="max-w-2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Info label={t("fields.name")}>{estimate.name}</Info>
        <Info label={t("fields.phone")}>{estimate.phone}</Info>
        <Info label={t("fields.email")}>{estimate.email || '-'}</Info>
        <Info label={t("fields.category")}>{estimate.category?.name || '-'}</Info>
        <Info label={t("fields.location")}>{estimate.location || '-'}</Info>
        <Info label={t("fields.budget")}>{estimate.budget || '-'}</Info>
        <Info label={t("fields.createdAt")}>{new Date(estimate.createdAt).toLocaleString()}</Info>
        <Info label={t("fields.locale")}>{estimate.locale || '-'}</Info>
      </div>
      <div className="mt-6">
        <div className="text-xs font-medium text-neutral-500 mb-1">{t("fields.detail")}</div>
        <div className="rounded-md border border-neutral-200 bg-neutral-50/60 p-3 text-sm leading-relaxed whitespace-pre-wrap break-words max-h-64 overflow-auto">
          {estimate.detail}
        </div>
      </div>
    </ModalShell>
  );
};

const Info: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col text-sm">
    <span className="text-xs font-medium text-neutral-500 mb-0.5 uppercase tracking-wide">{label}</span>
    <span className="text-neutral-800 truncate" title={typeof children === 'string' ? children : undefined}>{children}</span>
  </div>
);
