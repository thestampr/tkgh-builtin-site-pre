import { assertProvider } from '@/lib/auth/assertProvider';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    assertProvider(session);
    const userId = session!.user.id as string;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const published = searchParams.get('published'); // true | false | ALL
    const sort = searchParams.get('sort') || 'updated_desc';
    const where: Record<string, unknown> = { providerId: userId };
    if (published && published !== 'ALL') where.published = published === 'true';
    if (search) where.name = { contains: search, mode: 'insensitive' };
    let orderBy: any = { updatedAt: 'desc' };
    if (sort === 'name_asc') orderBy = { name: 'asc' };
    else if (sort === 'name_desc') orderBy = { name: 'desc' };
    else if (sort === 'created_desc') orderBy = { createdAt: 'desc' };
    else if (sort === 'created_asc') orderBy = { createdAt: 'asc' };
    const cats = await prisma.category.findMany({ where, orderBy });
    const ids = cats.map(c => c.id);
    let translations: any[] = [];
    if (ids.length) {
      translations = await prisma.categoryTranslation.findMany({ where: { categoryId: { in: ids } }, select: { categoryId: true, locale: true } });
    }
    const grouped = translations.reduce((acc: Record<string, string[]>, t: any) => { (acc[t.categoryId] ||= []).push(t.locale); return acc; }, {});
    const categories = cats.map(c => ({ ...c, languages: [process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'th', ...(grouped[c.id] || [])].join(', ') }));
    return NextResponse.json({ categories });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error' }, { status: e.message === 'FORBIDDEN' ? 403 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    assertProvider(session);
    const userId = session!.user.id as string;
    const body = await request.json();
    const { name, slug, description, coverImage, excerpt } = body;
    if (!name || !slug) return NextResponse.json({ error: 'name and slug required' }, { status: 400 });
    // Pre-check to give clearer feedback before hitting unique constraint
    const existing = await prisma.category.findFirst({ where: { providerId: userId, slug } });
    if (existing) {
      return NextResponse.json({ error: 'Duplicate slug' }, { status: 409 });
    }
    const created = await prisma.category.create({ data: { providerId: userId, name, slug, description: description || null, coverImage: coverImage || null, excerpt: excerpt || null } });
    return NextResponse.json({ category: { ...created, languages: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'th' } });
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Duplicate slug' }, { status: 409 });
    return NextResponse.json({ error: 'Create failed' }, { status: 500 });
  }
}
