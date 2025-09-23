import EstimateManager from "@/src/components/provider/EstimateManager";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function fetchProviderEstimatesAbs() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || (process.env.NODE_ENV === "development" ? "http" : "https");
  const base = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || "");
  if (!base) return [];
  const url = `${base}/api/account/estimates`;
  const cookieHeader = h.get('cookie') || '';
  const res = await fetch(url, { cache: 'no-store', headers: { cookie: cookieHeader } });
  if (!res.ok) return [];
  const json = await res.json().catch(() => ({}));
  return json.items || [];
}

export default async function ProviderEstimatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const items = await fetchProviderEstimatesAbs();
  return <EstimateManager initialEstimates={items} />;
}
