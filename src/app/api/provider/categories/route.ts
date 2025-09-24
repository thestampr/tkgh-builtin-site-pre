import { assertProvider } from '@/lib/auth/assertProvider';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { errorJson } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SortKind = 'updated_desc' | 'name_asc' | 'name_desc' | 'created_desc' | 'created_asc';
type PublishedFilter = 'ALL' | 'true' | 'false';

async function listCategories(userId: string, params: { search?: string; published?: PublishedFilter | null | undefined; sort?: SortKind | null | undefined; }) {
  const search = (params.search || '').trim();
  const published = params.published || null; // 'true' | 'false' | 'ALL' | null
  const sort = (params.sort || 'updated_desc') as SortKind;
  const where: Record<string, unknown> = { providerId: userId };
  if (published && published !== 'ALL') where.published = published === 'true';
  if (search) where.name = { contains: search, mode: 'insensitive' };
  let orderBy: Record<string, 'asc' | 'desc'> = { updatedAt: 'desc' };
  if (sort === 'name_asc') orderBy = { name: 'asc' };
  else if (sort === 'name_desc') orderBy = { name: 'desc' };
  else if (sort === 'created_desc') orderBy = { createdAt: 'desc' };
  else if (sort === 'created_asc') orderBy = { createdAt: 'asc' };
  const cats = await prisma.category.findMany({ where, orderBy });
  const ids = cats.map(c => c.id);
  let translations: { categoryId: string; locale: string }[] = [];
  if (ids.length) {
    translations = await prisma.categoryTranslation.findMany({ where: { categoryId: { in: ids } }, select: { categoryId: true, locale: true } });
  }
  const grouped = translations.reduce((acc: Record<string, string[]>, t) => { (acc[t.categoryId] ||= []).push(t.locale); return acc; }, {});
  const categories = cats.map(c => ({ ...c, languages: [process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'th', ...(grouped[c.id] || [])].join(', ') }));
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
