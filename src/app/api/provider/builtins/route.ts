import { defaultLocale } from '@/i18n/navigation';
import { assertProvider } from '@/lib/auth/assertProvider';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/db/prisma';
import { errorJson } from '@/lib/errors';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

type BuiltInSort = 'updated_desc' | 'title_asc' | 'title_desc' | 'views_desc' | 'favorites_desc';

async function listBuiltIns(userId: string, params: { 
  search?: string; 
  status?: string | null; 
  categoryId?: string | null; 
  sort?: BuiltInSort | null; 
}) {
  const search = (params.search || '').trim();
  const status = params.status || null; // PUBLISHED | DRAFT | ALL | null
  const categoryId = params.categoryId || null;
  const sort = (params.sort || 'updated_desc') as BuiltInSort;
  const where: Record<string, unknown> = { providerId: userId };
  
  if (status && status !== 'ALL') where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } }
    ];
  }

  let orderBy: Record<string, unknown> = { updatedAt: 'desc' };
  switch (sort) {
    case 'title_asc': orderBy = { title: 'asc' }; break;
    case 'title_desc': orderBy = { title: 'desc' }; break;
    case 'views_desc': orderBy = { viewCount: 'desc' }; break;
    case 'favorites_desc': orderBy = { favorites: { _count: 'desc' } }; break;
    default: orderBy = { updatedAt: 'desc' };
  }
  
  const itemsRaw = await prisma.builtIn.findMany({
    where: where,
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
  let languages: string[] = [defaultLocale];
  itemsRaw.forEach(i => {
    i.translations?.forEach(t => {
      if (!languages.includes(t.locale)) languages.push(t.locale);
    });
  });
  languages = Array.from(new Set(languages)); // ensure uniqueness
  const items = itemsRaw.map(i => ({
    ...i,
    languages: languages.join(", ")
  }));

  return items;
}

// List provider built-ins (include draft overlay indicator)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    assertProvider(session);
    const userId = session!.user.id as string;
    const { searchParams } = new URL(request.url);
    const items = await listBuiltIns(userId, {
      search: searchParams.get('search')?.trim() || '',
      status: searchParams.get('status'),
      categoryId: searchParams.get('categoryId'),
      sort: (searchParams.get('sort') as BuiltInSort | null) || 'updated_desc',
    });
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
    if (body?.action === 'list') {
      const items = await listBuiltIns(userId, {
        search: typeof body.search === 'string' ? body.search : undefined,
        status: typeof body.status === 'string' ? body.status : undefined,
        categoryId: typeof body.categoryId === 'string' ? body.categoryId : undefined,
        sort: body.sort as BuiltInSort | undefined,
      });
      return NextResponse.json({ items });
    }
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
