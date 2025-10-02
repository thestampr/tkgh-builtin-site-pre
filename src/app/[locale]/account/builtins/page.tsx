import BuiltInsManager from "@/components/provider/builtins/BuiltInsManager";
import { defaultLocale } from "@/i18n/navigation";
import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function fetchBuiltIns(providerId: string) {
  try {
    return await prisma.builtIn.findMany({ 
      where: { 
        providerId 
      }, 
      include: { 
        translations: true, 
        _count: {
          select: {
            favorites: true
          }
        }
      }, 
      orderBy: { 
        updatedAt: "desc" 
      } 
    });
  } catch (e) {
    console.error("Failed to load built-ins", e);
    return [];
  }
}

async function fetchCategories(providerId: string) {
  try {
    return await prisma.category.findMany({ 
      where: { 
        providerId, 
      }, 
      orderBy: { 
        createdAt: "asc" 
      } 
    });
  } catch (e) {
    console.error("Failed to load categories", e);
    return [];
  }
}

export default async function BuiltInsManagerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== "PROVIDER") redirect(`/${locale}/account`);

  const providerId = session.user.id;
  const [itemsRaw, categories] = await Promise.all([
    fetchBuiltIns(providerId),
    fetchCategories(providerId)
  ]);
  const items = itemsRaw.map(i => ({ 
    ...i, 
    languages: Array.from(new Set([defaultLocale, ...(i.translations?.map(t => {
      if (t.published) return t.locale;
      else return `${t.locale}*`;
    }) || [])])).join(", ") || defaultLocale
  }));
  
  return <BuiltInsManager initialItems={items} categories={categories} />;
}
