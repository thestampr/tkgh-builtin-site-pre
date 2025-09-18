import ProfileEditor from "@/components/provider/ProfileEditor";
import { authOptions } from "@/lib/auth/options";
import { getProfile } from "@/lib/api";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProviderProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== "PROVIDER") redirect(`/${locale}/account`);
  
  const profile = await getProfile(session.user.id);
  return <ProfileEditor initialProfile={profile} />;
}
