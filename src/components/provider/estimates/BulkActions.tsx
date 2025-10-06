"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";

type Op = 'markViewed' | 'archive' | 'unarchive' | 'delete';

interface BulkActionsProps {
  count: number;
  disabled?: boolean;
  onAction: (op: Op) => Promise<void> | void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({ count, disabled, onAction }) => {
  const [confirming, setConfirming] = useState<Op | null>(null);
  const t = useTranslations("ProviderEstimates");

  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-md p-2 text-xs">
      <span className="text-neutral-600 font-medium">{t("bulk.selectedPrefix")}{count}</span>
      {confirming && (
        <div className="flex items-center gap-2 ml-2">
          <span className="text-neutral-600">{t(`bulk.confirm.${confirming}.message`)}</span>
          <button className="btn btn-danger btn-xs" onClick={() => { onAction(confirming); setConfirming(null); }}>{t("bulk.confirm.ok")}</button>
          <button className="btn btn-ghost btn-xs" onClick={() => setConfirming(null)}>{t("bulk.confirm.cancel")}</button>
        </div>
      )}
      {!confirming && (
        <>
          <button
            className="btn btn-success btn-xs"
            disabled={disabled}
            onClick={() => onAction('markViewed')}
          >{t("bulk.markViewed")}</button>
          <button
            className="btn btn-secondary btn-xs"
            disabled={disabled}
            onClick={() => onAction('archive')}
          >{t("bulk.archive")}</button>
          <button
            className="btn btn-ghost btn-xs"
            disabled={disabled}
            onClick={() => onAction('unarchive')}
          >{t("bulk.unarchive")}</button>
          <button
            className="btn btn-danger btn-xs"
            disabled={disabled}
            onClick={() => setConfirming('delete')}
          >{t("bulk.delete")}</button>
        </>
      )}
    </div>
  );
};
