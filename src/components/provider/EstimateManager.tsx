"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Estimate } from "@prisma/client";

interface EstimateManagerProps {
  initialEstimates: Estimate[];
}

export default function EstimateManager({ initialEstimates }: EstimateManagerProps) {
  const t = useTranslations("ProviderEstimates");
  const [estimates, setEstimates] = useState(initialEstimates);

  return (
    <div className="max-w-5xl mx-auto px-6 pb-10 space-y-10">
      <main className="flex-1">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#8a6a40] via-[#a4814f] to-[#8a6a40]">{t("title")}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t("subtitle")}</p>
        </div>
        <div className="rounded-xl border border-neutral-200/70 bg-white/70 backdrop-blur p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-neutral-500">
                <tr>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Phone</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Budget</th>
                  <th className="py-2 pr-4">Detail</th>
                </tr>
              </thead>
              <tbody>
                {estimates.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-neutral-500">No submissions yet</td>
                  </tr>
                )}
                {estimates.map((it: any) => (
                  <tr key={it.id} className="border-t border-neutral-200/60">
                    <td className="py-2 pr-4 whitespace-nowrap">{new Date(it.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-4">{it.name}</td>
                    <td className="py-2 pr-4">{it.phone}</td>
                    <td className="py-2 pr-4">{it.email || '-'}</td>
                    <td className="py-2 pr-4">{it.category || '-'}</td>
                    <td className="py-2 pr-4">{it.budget || '-'}</td>
                    <td className="py-2 pr-4 max-w-[420px] truncate" title={it.detail}>{it.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}