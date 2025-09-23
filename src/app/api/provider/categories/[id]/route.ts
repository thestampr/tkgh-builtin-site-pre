import { assertProvider } from '@/lib/auth/assertProvider';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { errorJson } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function ownedCategory(id: string, providerId: string) {
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat || cat.providerId !== providerId) throw new Error('NOT_FOUND');
  return cat;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions); 
    assertProvider(session);
    const { id } = await params; const userId = session!.user.id as string;
    const cat = await ownedCategory(id, userId);
    const translations = await prisma.categoryTranslation.findMany({ where: { categoryId: id } });
    const languages = [process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'th', ...translations.map(t => t.locale)].join(', ');
    return NextResponse.json({ category: { ...cat, languages, translations } });
  } catch (e: unknown) { 
    const { body, status } = errorJson(e, 'Error');
    return NextResponse.json(body, { status }); 
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions); 
    assertProvider(session);
    const { id } = await params; const userId = session!.user.id as string;
    await ownedCategory(id, userId);
    const body = await request.json();
    const { name, description, published, coverImage, excerpt, translationLocale, translation } = body;
    let updated = null;
    if (translationLocale && translationLocale !== (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'th')) {
      // Upsert translation
      await prisma.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: id, locale: translationLocale } },
        create: { categoryId: id, locale: translationLocale, name: translation?.name || null, description: translation?.description || null, excerpt: translation?.excerpt || null, published: !!translation?.published },
        update: { name: translation?.name || null, description: translation?.description || null, excerpt: translation?.excerpt || null, published: !!translation?.published }
      });
      updated = await prisma.category.findUnique({ where: { id } });
    } else {
      updated = await prisma.category.update({
        where: { id }, data: {
          name: name ?? undefined,
          description: description ?? undefined,
          coverImage: coverImage === null ? null : coverImage ?? undefined,
          excerpt: excerpt === null ? null : excerpt ?? undefined,
          published: typeof published === 'boolean' ? published : undefined
        }
      });
    }
    const translations = await prisma.categoryTranslation.findMany({ where: { categoryId: id }, select: { locale: true } });
    const languages = [process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'th', ...translations.map(t => t.locale)].join(', ');
    return NextResponse.json({ category: { ...updated, languages } });
  } catch (e: unknown) { 
    const { body, status } = errorJson(e, 'Error');
    return NextResponse.json(body, { status }); 
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions); 
    assertProvider(session);
    const { id } = await params; const userId = session!.user.id as string;
    await ownedCategory(id, userId);
    // Manual cascade: detach built-ins, delete translations, then delete category
    await prisma.$transaction([
      prisma.builtIn.updateMany({ where: { categoryId: id }, data: { categoryId: null } }),
      prisma.categoryTranslation.deleteMany({ where: { categoryId: id } }),
      prisma.category.delete({ where: { id } })
    ]);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) { 
    const { body, status } = errorJson(e, 'Error');
    return NextResponse.json(body, { status }); 
  }
}
