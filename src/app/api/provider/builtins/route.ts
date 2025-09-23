import { assertProvider } from '@/lib/auth/assertProvider';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/db/prisma';
import { errorJson } from '@/lib/errors';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

// List provider built-ins (include draft overlay indicator)
export async function GET(request: Request) {
  try {
    // Acquire session immediately (no prior awaits that would force dynamic header iteration)
    const session = await getServerSession(authOptions);
    assertProvider(session);
    const userId = session!.user.id as string;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status'); // PUBLISHED | DRAFT | ALL
    const categoryId = searchParams.get('categoryId');
    const sort = searchParams.get('sort') || 'updated_desc';

    const where: Record<string, unknown> = { providerId: userId };
    if (status && status !== 'ALL') where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      // Prisma version in use appears to not support `mode: 'insensitive'` for contains; fallback: lowercase compare.
      // Assuming titles are not huge volume; perform two contains filters ORed without mode (case-sensitive) plus lowered duplicate columns approach is unavailable.
      // Simplest: broaden by OR with original and capitalized variants if needed. Here we just use contains directly; for better case-insensitivity, add both exact and lower search.
      const s1 = search;
      const s2 = search.toLowerCase();
      where.OR = [
        { title: { contains: s1 } },
        { title: { contains: s2 } },
        { summary: { contains: s1 } },
        { summary: { contains: s2 } }
      ];
    }

    let orderBy: any = { updatedAt: 'desc' };
    if (sort === 'title_asc') orderBy = { title: 'asc' };
    else if (sort === 'title_desc') orderBy = { title: 'desc' };
    else if (sort === 'views_desc') orderBy = { viewCount: 'desc' };
    else if (sort === 'favorites_desc') orderBy = { favorites: { _count: 'desc' } };
    // default remains updatedAt desc

    const itemsRaw = await prisma.builtIn.findMany({ where, orderBy, include: { _count: { select: { favorites: true } } } });
    const ids = itemsRaw.map(i => i.id);
    let translations: any[] = [];
    if (ids.length) translations = await prisma.builtInTranslation.findMany({ where: { builtInId: { in: ids } }, select: { builtInId: true, locale: true } });
    const grouped = translations.reduce((acc: Record<string, string[]>, t: any) => { (acc[t.builtInId] ||= []).push(t.locale); return acc; }, {});
    const base = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'th';
    const items = itemsRaw.map(i => ({ ...i, favoritesCount: (i as any)._count?.favorites || 0, languages: [base, ...(grouped[i.id] || [])].join(', ') }));
    return NextResponse.json({ items });
  } catch (e: unknown) {
    const { body, status } = errorJson(e, 'Error');
    return NextResponse.json(body, { status });
  }
}

// Create new built-in (starts as DRAFT)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    assertProvider(session);
    const userId = session!.user.id as string;
    const body = await request.json();
    const { title, summary, content, price, currency, categoryId, coverImage, gallery } = body;
    let { slug } = body;
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });
    if (!slug) {
      slug = title.toLowerCase().trim().replace(/[^a-z0-9ก-๙\s-]/g, '').replace(/\s+/g, '-').substring(0, 80);
    }
    const created = await prisma.builtIn.create({
      data: {
        providerId: userId,
        title,
        slug,
        summary: summary || null,
        content: content || null,
        price: typeof price === 'number' ? price : null,
        currency: typeof currency === 'string' && currency.length <= 8 ? currency.toUpperCase() : null,
        categoryId: categoryId || null,
        coverImage: coverImage || null,
        galleryJson: Array.isArray(gallery) ? JSON.stringify(gallery.slice(0, 12)) : undefined,
        status: 'DRAFT'
      }
    });
    return NextResponse.json({ item: { ...created, languages: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'th' } });
  } catch (e: unknown) {
    const { body, status } = errorJson(e, 'Error');
    return NextResponse.json(body, { status });
  }
}
