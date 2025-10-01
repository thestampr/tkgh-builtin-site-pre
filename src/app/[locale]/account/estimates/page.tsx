import { EstimateManager } from "@/components/provider/estimates/EstimateManager";
import { getProviderFormSubmissions } from "@/lib/api";
import { authOptions } from "@/lib/auth/options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProviderEstimatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== 'PROVIDER') redirect(`/${locale}/account`);
  const userId = session.user.id;

  const items = await getProviderFormSubmissions(userId, locale);
  return <EstimateManager initial={items} />;
}
