import { getTranslations } from "next-intl/server";
import { EstimateForm } from "@/components/EstimateForm";
import { getCategoriesByProvider } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string, providerId: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Estimate" });
  return { title: t("title"), description: t("desc") };
}

export default async function ProviderEstimatePage({ params }: { params: Promise<{ locale: string, providerId: string }> }) {
  const { locale, providerId } = await params;
  const categories = await getCategoriesByProvider(providerId, { locale });
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-12 xl:px-20 py-10 md:py-16 md:min-h-[70vh]">
        <div className="grid gap-10 md:gap-12 md:grid-cols-2">
          <div className="self-center max-w-xl mx-auto md:mx-0">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Estimate</h1>
            <p className="mt-4 text-slate-600">Fill in your project details to receive an estimate from this provider.</p>
          </div>
          <div className="mx-auto md:justify-self-end w-full max-w-xl">
            <div className="bg-white border rounded-2xl shadow-sm p-6 md:p-8">
              <EstimateForm locale={locale} categories={categories} providerId={providerId} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
