import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  summary: z.string().optional(),
  content: z.string().optional(),
  categoryId: z.string().optional(),
  coverImage: z.string().url().optional(),
  gallery: z.array(z.string()).optional(),
  publish: z.boolean().optional()
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get('providerId') || undefined;
  const status = searchParams.get('status');
  const where: { [key: string]: string } = { status: 'PUBLISHED' };
  if (providerId) where.providerId = providerId;
  if (status === 'all') delete where.status;
  const data = await prisma.builtIn.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, slug: true, summary: true, coverImage: true, status: true, providerId: true }
  });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'PROVIDER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const json = await req.json();
    const parsed = createSchema.parse(json);
    const now = new Date();
    const built = await prisma.builtIn.create({
      data: {
        providerId: session.user.id,
        title: parsed.title,
        slug: parsed.slug,
        summary: parsed.summary,
        content: parsed.content,
        categoryId: parsed.categoryId,
        coverImage: parsed.coverImage,
        status: parsed.publish ? 'PUBLISHED' : 'DRAFT',
        publishedAt: parsed.publish ? now : null
      },
      select: { id: true, title: true, slug: true, status: true }
    });
    return NextResponse.json({ built });
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.name === 'ZodError') {
        return NextResponse.json({ error: e }, { status: 400 });
      }
      if ('code' in e && e.code === 'P2002') {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
      }
    }
    console.error('Create built-in error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
