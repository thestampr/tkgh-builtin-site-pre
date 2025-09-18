import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale, namespace: "Contact" });
  return {
    title: t("title"),
    description: t("desc")
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-3xl px-6 lg:px-12 xl:px-20 py-10 md:py-16">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-slate-600">{t("subtitle")}</p>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm p-6">
          <dl className="grid gap-4">
            <div>
              <dt className="text-sm text-slate-600">{t("email")}</dt>
              <dd className="text-slate-900 font-medium">hello@example.com</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-600">{t("phone")}</dt>
              <dd className="text-slate-900 font-medium">(+66) 02-000-0000</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-600">{t("address")}</dt>
              <dd className="text-slate-900 font-medium">
                123 Studio Road, Bangkok, Thailand
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}