import { assertProvider } from '@/lib/auth/assertProvider';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/db/prisma';
import { errorJson } from '@/lib/errors';
import { defaultLocale } from '@/i18n/navigation';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SortKind = 'updated_desc' | 'name_asc' | 'name_desc' | 'created_desc' | 'created_asc';
type PublishedFilter = 'ALL' | 'true' | 'false';

async function listCategories(userId: string, params: { 
  search?: string; 
  published?: PublishedFilter | null;
  sort?: SortKind | null; 
  locale?: string | null; 
}) {
  const search = (params.search || '').trim();
  const published = params.published || null;
  const sort = (params.sort || 'updated_desc') as SortKind;
  const where: Record<string, unknown> = { providerId: userId };

  if (published && published !== 'ALL') where.published = published === 'true';
  if (search) where.name = { contains: search, mode: 'insensitive' };

  let orderBy: Record<string, 'asc' | 'desc'> = { updatedAt: 'desc' };
  switch (sort) {
    case 'name_asc': orderBy = { name: 'asc' }; break;
    case 'name_desc': orderBy = { name: 'desc' }; break;
    case 'created_asc': orderBy = { createdAt: 'asc' }; break;
    case 'created_desc': orderBy = { createdAt: 'desc' }; break;
    default: orderBy = { updatedAt: 'desc' };
  }

  const cats = await prisma.category.findMany({ 
    where, 
    include: {
      translations: true
    },
    orderBy 
  });
  const categories = cats.map(c => ({
    ...c,
    languages: Array.from(new Set([defaultLocale, ...(c.translations?.map(t => {
      if (t.published) return t.locale;
      else return `${t.locale}*`;
    }) || [])])).join(", ") || defaultLocale
  }));

  return categories;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    assertProvider(session);
    const userId = session!.user.id as string;
    const { searchParams } = new URL(request.url);
    const categories = await listCategories(userId, {
      search: searchParams.get('search')?.trim() || '',
      published: (searchParams.get('published') as PublishedFilter | null) || null,
      sort: (searchParams.get('sort') as SortKind | null) || 'updated_desc'
    });
    return NextResponse.json({ categories });
  } catch (e: unknown) {
    const { body, status } = errorJson(e, 'Error');
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    assertProvider(session);
    const userId = session!.user.id as string;
    const body = await request.json();
    if (body?.action === 'list') {
      const categories = await listCategories(userId, {
        search: typeof body.search === 'string' ? body.search : undefined,
        published: body.published as PublishedFilter | undefined,
        sort: body.sort as SortKind | undefined,
      });
      return NextResponse.json({ categories });
    }
    const { name, slug, description, coverImage, excerpt } = body;
    if (!name || !slug) return NextResponse.json({ error: 'name and slug required' }, { status: 400 });
    // Pre-check to give clearer feedback before hitting unique constraint
    const existing = await prisma.category.findFirst({ where: { providerId: userId, slug } });
    if (existing) {
      return NextResponse.json({ error: 'Duplicate slug' }, { status: 409 });
    }
    const created = await prisma.category.create({ data: { providerId: userId, name, slug, description: description || null, coverImage: coverImage || null, excerpt: excerpt || null } });
    return NextResponse.json({ category: { ...created, languages: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'th' } });
  } catch (err: unknown) {
    const code = (err as { code?: string } | null)?.code;
    if (code === 'P2002') return NextResponse.json({ error: 'Duplicate slug' }, { status: 409 });
    const { body, status } = errorJson(err, 'Create failed');
    return NextResponse.json(body, { status });
  }
}
