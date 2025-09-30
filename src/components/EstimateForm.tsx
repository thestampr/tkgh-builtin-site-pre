"use client";

import type { Category } from "@/lib/api";
import { useTranslations } from "next-intl";
import { FormEventHandler, useRef, useState } from "react";
import { z } from "zod";

const schema = z.object({
  locale: z.string().optional(),
  name: z.string().min(1),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  budget: z.string().optional().or(z.literal("")),
  detail: z.string().min(1),
  providerId: z.string().optional().or(z.literal("")),
});

interface FormData {
  locale?: string;
  name: string;
  phone: string;
  email?: string;
  location?: string;
  categoryId?: string;
  budget?: string;
  detail: string;
  providerId?: string;
}

interface EstimateFormProps {
  locale: string;
  categories: Category[];
  providerId?: string;
}

const defaultFormData: FormData = {
  locale: "",
  name: "",
  phone: "",
  email: "",
  location: "",
  categoryId: "",
  budget: "",
  detail: "",
  providerId: "",
};

export function EstimateForm({ locale, categories, providerId }: EstimateFormProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations("Estimate");
  const tc = useTranslations("Common");

  const resetForm = () => {
    setFormData(defaultFormData);
  };

  const onFormSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setLoading(true);
    setOk(null);
    setError(null);

    const categoryId = String(formData.categoryId || "");
    const providerOfCategory = categoryId ? categories.find(c => c.id === categoryId) : null;

    const payload = {
      ...formData,
      locale,
      providerId: providerId || providerOfCategory?.providerId || formData.providerId || undefined,
    };

    console.log(payload);
    console.log(formData);

    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        // Response is not JSON
      }

      const isOkFlag = typeof data === 'object' && data !== null && 'ok' in data ? (data as any).ok : undefined;
      if (!res.ok || isOkFlag === false) {
        const msg = typeof data === 'object' && data !== null && 'error' in data ? String((data as any).error) : `Request failed with status ${res.status}`;
        throw new Error(msg);
      }

      setOk(true);
      resetForm();
    } catch (e: unknown) {
      setOk(false);
      const msg = e instanceof Error ? e.message : typeof e === 'string' ? e : tc("failed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const labelCls = "block text-sm font-medium mb-1 text-slate-800";
  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 px-3 py-2 " +
    "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary";
  const textareaCls = inputCls + " min-h-[120px]";

  return (
    <form
      onSubmit={onFormSubmit}
      className="grid gap-4 text-slate-800"
      aria-live="polite"
      noValidate
    >
      <fieldset disabled={loading} className="grid gap-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className={labelCls}>{t("name")}</label>
            <input id="name" name="name" required className={inputCls} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="phone" className={labelCls}>{t("phone")}</label>
            <input id="phone" name="phone" required className={inputCls} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className={labelCls}>{t("email")}</label>
            <input id="email" name="email" type="email" className={inputCls} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div>
            <label htmlFor="location" className={labelCls}>{t("location")}</label>
            <input id="location" name="location" className={inputCls} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className={labelCls}>{t("category")}</label>
            <select id="category" name="category" className={inputCls} defaultValue="" onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
              <option value="">{t("category")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="budget" className={labelCls}>{t("budget")}</label>
            <input id="budget" name="budget" className={inputCls} placeholder="300,000" onChange={(e) => setFormData({ ...formData, budget: e.target.value })} />
          </div>
        </div>

        <div>
          <label htmlFor="detail" className={labelCls}>{t("detail")}</label>
          <textarea id="detail" name="detail" required className={textareaCls} onChange={(e) => setFormData({ ...formData, detail: e.target.value })} />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
          >
            {loading ? t("sending") : t("submit")}
          </button>
        </div>
      </fieldset>

      {ok && (
        <div className="rounded-md bg-green-50 text-green-800 px-4 py-2 border border-green-200" role="status">
          {tc("success")}
        </div>
      )}
      {ok === false && (
        <div className="rounded-md bg-red-50 text-red-800 px-4 py-2 border border-red-200" role="alert">
          {tc("failed")}
          {error ? `: ${error}` : ""}
        </div>
      )}
    </form>
  );
}