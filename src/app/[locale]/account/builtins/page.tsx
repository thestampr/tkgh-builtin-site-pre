import BuiltInsManager from "@/components/provider/builtins/BuiltInsManager";
import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";
import { defaultLocale } from "@/i18n/navigation";
import type { BuiltIn } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface BuiltInTranslation {
  builtInId: string;
  locale: string;
}

async function fetchBuiltIns(providerId: string): Promise<BuiltIn[]> {
  try {
    return await prisma.builtIn.findMany({ 
      where: { 
        providerId 
      }, 
      include: { 
        translations: true, 
        favorites: true
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
        published: true 
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
  const ids = itemsRaw.map(i => i.id);
  let translations: BuiltInTranslation[] = [];
  if (ids.length && prisma.builtInTranslation?.findMany) {
    translations = await prisma.builtInTranslation.findMany({ 
      where: { 
        builtInId: { 
          in: ids 
        }, 
        published: true 
      }, 
      select: { 
        builtInId: true, 
        locale: true 
      } 
    });
  }

  const grouped = translations.reduce((acc: Record<string, string[]>, t: BuiltInTranslation) => { 
    (acc[t.builtInId] ||= []).push(t.locale); 
    return acc; 
  }, {});
  const items = itemsRaw.map(i => ({ 
    ...i, 
    languages: [defaultLocale, ...(grouped[i.id] || [])].join(", "),
    galleryJson: i.galleryJson
  }));
  return <BuiltInsManager initialItems={items} categories={categories} />;
}
