"use client";

import type { Category } from "@/lib/api";
import { useTranslations } from "next-intl";
import { FormEventHandler, useState } from "react";
import { useToast } from "../hooks/useToast";

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

  const { showSuccessToast, showErrorToast } = useToast();

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

    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setOk(res.ok);

      if (res.ok) {
        resetForm();
        showSuccessToast({
          title: t("messages.estimateRequestSent.title"),
          description: t("messages.estimateRequestSent.description")
        });
      } else {
        switch (res.status) {
          case 400:
            setError(t("messages.errors.missingInfo.description"));
            return showErrorToast({
              title: t("messages.errors.missingInfo.title"),
              description: t("messages.errors.missingInfo.description")
            });
          case 404:
            setError(t("messages.errors.invalid.description"));
            return showErrorToast({
              title: t("messages.errors.invalid.title"),
              description: t("messages.errors.invalid.description")
            });
          case 500:
          default:
            setError(t("messages.failed"));
            return showErrorToast({
              title: t("messages.errors.error.title"),
              description: t("messages.errors.error.description")
            });
        }
      }
    } catch (e: unknown) {
      setOk(false);
      setError(t("messages.errors.error.title"));
      return showErrorToast({
        title: t("messages.errors.error.title"),
        description: t("messages.errors.error.description")
      });
    } finally {
      setLoading(false);
    }
  }

  const labelCls = "block text-xs font-medium mb-1 text-slate-800";
  const inputCls = "w-full input";
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
          <div className="text-sm h-6" role="status">
            {ok 
              ? <span className="text-success">{t("messages.success")}</span> 
              : <span className="text-danger">{error}</span>
            }
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? t("sending") : t("submit")}
          </button>
        </div>
      </fieldset>
    </form>
  );
}