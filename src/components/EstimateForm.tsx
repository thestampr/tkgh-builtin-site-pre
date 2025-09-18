"use client";

import { useRef, useState } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import type { Category } from "@/lib/api";

const schema = z.object({
  locale: z.string().optional(),
  name: z.string().min(1),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  budget: z.string().optional().or(z.literal("")),
  detail: z.string().min(1),
});

interface EstimateFormProps {
  locale: string;
  categories: Category[];
}

export function EstimateForm({ locale, categories }: EstimateFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("Estimate");
  const tc = useTranslations("Common");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setOk(null);
    setError(null);

    const formEl = formRef.current || (e.currentTarget as HTMLFormElement);
    const fd = new FormData(formEl);

    const payload = {
      locale,
      name: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      location: String(fd.get("location") || ""),
      category: String(fd.get("category") || ""),
      budget: String(fd.get("budget") || ""),
      detail: String(fd.get("detail") || ""),
    };

    const parse = schema.safeParse(payload);
    if (!parse.success) {
      setLoading(false);
      setError(t("validation"));
      return;
    }

    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Response is not JSON
      }

      if (!res.ok || (data && data.ok === false)) {
        const msg = data?.error || `Request failed with status ${res.status}`;
        throw new Error(msg);
      }

      setOk(true);
      formRef.current?.reset();
    } catch (e: any) {
      setOk(false);
      setError(e?.message || tc("failed"));
    } finally {
      setLoading(false);
    }
  }

  const labelCls = "block text-sm font-medium mb-1 text-slate-800";
  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 px-3 py-2 " +
    "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary";
  const selectCls = inputCls;
  const textareaCls = inputCls + " min-h-[120px]";

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="grid gap-4 text-slate-800"
      aria-live="polite"
      noValidate
    >
      <fieldset disabled={loading} className="grid gap-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className={labelCls}>
              {t("name")}
            </label>
            <input id="name" name="name" required className={inputCls} />
          </div>
          <div>
            <label htmlFor="phone" className={labelCls}>
              {t("phone")}
            </label>
            <input id="phone" name="phone" required className={inputCls} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className={labelCls}>
              {t("email")}
            </label>
            <input id="email" name="email" type="email" className={inputCls} />
          </div>
          <div>
            <label htmlFor="location" className={labelCls}>
              {t("location")}
            </label>
            <input id="location" name="location" className={inputCls} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className={labelCls}>
              {t("category")}
            </label>
            <select id="category" name="category" className={selectCls} defaultValue="">
              <option value="">{t("category")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug!}>
                  {category.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="budget" className={labelCls}>
              {t("budget")}
            </label>
            <input id="budget" name="budget" className={inputCls} placeholder="300,000" />
          </div>
        </div>

        <div>
          <label htmlFor="detail" className={labelCls}>
            {t("detail")}
          </label>
          <textarea id="detail" name="detail" required className={textareaCls} />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary text-white px-6 py-3 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
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