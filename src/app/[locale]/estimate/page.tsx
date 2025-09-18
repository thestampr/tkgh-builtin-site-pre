import { getTranslations } from "next-intl/server";
import { EstimateForm } from "@/components/EstimateForm";
import { getCategories } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale, namespace: "Estimate" });
  return {
    title: t("title"),
    description: t("desc")
  };
}

export default async function EstimatePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale, namespace: "Estimate" });
  const categories = await getCategories({locale});

  return (
    <>
    <section className="bg-white">
      {/* Wider max width with generous side paddings for clean spacing */}
      <div className="mx-auto max-w-7xl px-6 lg:px-12 xl:px-20 py-10 md:py-16 md:min-h-[70vh]">
        <div className="grid gap-10 md:gap-12 md:grid-cols-2">
          {/* Left content centered vertically within the section */}
          <div className="self-center max-w-xl mx-auto md:mx-0">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              {t("title")}
            </h1>
            <p className="mt-4 text-slate-600">
              {t("desc")}
            </p>

            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-primary/80" />
                <span className="text-slate-700">{t("side.points.0")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-primary/80" />
                <span className="text-slate-700">{t("side.points.1")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-primary/80" />
                <span className="text-slate-700">{t("side.points.2")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-primary/80" />
                <span className="text-slate-700">{t("side.points.3")}</span>
              </li>
            </ul>

            {/* Avatar stack and loved-by copy */}
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-3">
                {/* Decorative avatar placeholders; replace with real images if available */}
                <span
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-white bg-gradient-to-br from-slate-300 to-slate-200"
                  aria-hidden="true"
                />
                <span
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-white bg-gradient-to-br from-slate-300 to-slate-200"
                  aria-hidden="true"
                />
                <span
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-white bg-gradient-to-br from-slate-300 to-slate-200"
                  aria-hidden="true"
                />
                <span
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-white bg-gradient-to-br from-slate-300 to-slate-200"
                  aria-hidden="true"
                />
                <span
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-white bg-gradient-to-br from-slate-300 to-slate-200"
                  aria-hidden="true"
                />
              </div>
              <p className="text-slate-600">
                {t("side.lovedBy", { count: 400 })}
              </p>
            </div>
          </div>

          {/* Right column: form card aligned to the right */}
          <div className="mx-auto md:justify-self-end w-full max-w-xl">
            <div className="bg-white border rounded-2xl shadow-sm p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                  {t("form.title")}
                </h2>
                <p className="mt-2 text-slate-600">
                  {t("form.subtitle")}
                </p>
              </div>
              <EstimateForm locale={locale} categories={categories} />
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}