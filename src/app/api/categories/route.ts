import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  published: z.boolean().optional()
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get('providerId') || undefined;
  const where: Record<string, unknown> = { published: true };
  if (providerId) where.providerId = providerId;
  const categories = await prisma.category.findMany({
    where,
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true, providerId: true }
  });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'PROVIDER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const json = await req.json();
    const parsed = createSchema.parse(json);
    const category = await prisma.category.create({
      data: {
        providerId: session.user.id,
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description,
        published: parsed.published ?? true
      },
      select: { id: true, name: true, slug: true }
    });
    return NextResponse.json({ category });
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.name === 'ZodError') return NextResponse.json({ error: e }, { status: 400 });
      if ('code' in e && e.code === 'P2002') return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    console.error('Create category error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
