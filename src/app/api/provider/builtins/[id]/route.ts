import { assertProvider } from '@/lib/auth/assertProvider';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

async function requireOwnedBuiltIn(id: string, providerId: string) {
  const item = await prisma.builtIn.findUnique({ where: { id } });
  if (!item || item.providerId !== providerId) throw new Error('NOT_FOUND');
  return item;
}

// GET built-in detail (live fields only)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    assertProvider(session);
    const { id } = await params;
    const userId = session!.user.id as string;
    const item = await requireOwnedBuiltIn(id, userId);
    const translations = await prisma.builtInTranslation.findMany({ where: { builtInId: id } });
    const languages = [process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'th', ...translations.map((t: any) => t.locale)].join(', ');
    return NextResponse.json({ item: { ...item, languages, translations } });
  } catch (e: any) {
    const status = e.message === 'FORBIDDEN' ? 403 : e.message === 'NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ error: e.message || 'Error' }, { status });
  }
}

// PUT: update fields directly (no draft layer)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    assertProvider(session);
    const { id } = await params;
    const userId = session!.user.id as string;
    await requireOwnedBuiltIn(id, userId);
    const body = await request.json();
    if (body && body.direct && !body.translationLocale) {
      const { title, summary, content, price, currency, categoryId, coverImage, gallery, status } = body;
      const updated = await prisma.builtIn.update({
        where: { id }, data: {
          title: title ?? undefined,
          summary: summary ?? undefined,
          content: content ?? undefined,
          price: typeof price === 'number' ? price : undefined,
          currency: typeof currency === 'string' ? currency.toUpperCase() : undefined,
          categoryId: categoryId === null ? null : categoryId ?? undefined,
          coverImage: coverImage === '' ? null : coverImage ?? undefined,
          galleryJson: Array.isArray(gallery) ? JSON.stringify(gallery.slice(0, 12)) : undefined,
          status: status ?? undefined
        }
      });
      const translations = await prisma.builtInTranslation.findMany({ where: { builtInId: id }, select: { locale: true } });
      const languages = [process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'th', ...translations.map((t: any) => t.locale)].join(', ');
      return NextResponse.json({ item: { ...updated, languages } });
    }
    // translation upsert path
    if (body && body.translationLocale) {
      const { translationLocale, translation } = body;
      if (translationLocale !== (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'th')) {
        await prisma.builtInTranslation.upsert({
          where: { builtInId_locale: { builtInId: id, locale: translationLocale } },
          create: { builtInId: id, locale: translationLocale, title: translation?.title || null, summary: translation?.summary || null, content: translation?.content || null, ctaLabel: translation?.ctaLabel || null, price: typeof translation?.price === 'number' ? translation.price : null, currency: typeof translation?.currency === 'string' ? translation.currency.toUpperCase() : null, published: !!translation?.published },
          update: { title: translation?.title || null, summary: translation?.summary || null, content: translation?.content || null, ctaLabel: translation?.ctaLabel || null, price: typeof translation?.price === 'number' ? translation.price : null, currency: typeof translation?.currency === 'string' ? translation.currency.toUpperCase() : undefined, published: !!translation?.published }
        });
      }
      const base = await prisma.builtIn.findUnique({ where: { id } });
      const translations = await prisma.builtInTranslation.findMany({ where: { builtInId: id }, select: { locale: true } });
      const languages = [process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'th', ...translations.map((t: any) => t.locale)].join(', ');
      return NextResponse.json({ item: { ...base, languages } });
    }
    return NextResponse.json({ item: await prisma.builtIn.findUnique({ where: { id } }) });
  } catch (e: any) {
    const status = e.message === 'FORBIDDEN' ? 403 : e.message === 'NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ error: e.message || 'Error' }, { status });
  }
}

// POST: action publish | unpublish
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    assertProvider(session);
    const { id } = await params;
    const userId = session!.user.id as string;
    const item = await requireOwnedBuiltIn(id, userId);
    const { action } = await request.json();
    if (action === 'publish') {
      const updated = await prisma.builtIn.update({ where: { id }, data: { status: 'PUBLISHED', publishedAt: item.publishedAt || new Date() }, include: { _count: { select: { favorites: true } } } });
      return NextResponse.json({ item: { ...updated, favoritesCount: (updated as any)._count?.favorites || 0 } });
    } else if (action === 'unpublish') {
      const updated = await prisma.builtIn.update({ where: { id }, data: { status: 'DRAFT' }, include: { _count: { select: { favorites: true } } } });
      return NextResponse.json({ item: { ...updated, favoritesCount: (updated as any)._count?.favorites || 0 } });
    }
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (e: any) {
    const status = e.message === 'FORBIDDEN' ? 403 : e.message === 'NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ error: e.message || 'Error' }, { status });
  }
}

// DELETE built-in
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    assertProvider(session);
    const { id } = await params;
    const userId = session!.user.id as string;
    await requireOwnedBuiltIn(id, userId);
    // Manually remove dependents to avoid FK constraint errors (translations, favorites, analytics events)
    await prisma.$transaction([
      prisma.builtInTranslation.deleteMany({ where: { builtInId: id } }),
      prisma.favoriteBuiltIn.deleteMany({ where: { builtInId: id } }),
      prisma.analyticsEvent.deleteMany({ where: { builtInId: id } }),
      prisma.builtIn.delete({ where: { id } })
    ]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e.message === 'FORBIDDEN' ? 403 : e.message === 'NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ error: e.message || 'Error' }, { status });
  }
}
