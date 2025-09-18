import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { z } from 'zod';

type AnyKeys = { [key: string]: string | boolean | string[] | Date | undefined | null };

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  summary: z.string().optional(),
  content: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  coverImage: z.string().url().nullable().optional(),
  gallery: z.array(z.string()).optional(),
  publish: z.boolean().optional(),
  unpublish: z.boolean().optional()
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const built = await prisma.builtIn.findUnique({
    where: { id },
    include: { provider: { select: { id: true, profile: true } }, category: true }
  });
  if (!built) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (built.status !== 'PUBLISHED') {
    // Only owner can see draft
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.id !== built.providerId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }
  return NextResponse.json({ built });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'PROVIDER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const built = await prisma.builtIn.findUnique({ where: { id } });
  if (!built) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (built.providerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const json = await req.json();
    const parsed = updateSchema.parse(json);
    const data: AnyKeys = { ...parsed };
    if (parsed.publish) {
      data.status = 'PUBLISHED';
      data.publishedAt = new Date();
    }
    if (parsed.unpublish) {
      data.status = 'DRAFT';
      data.publishedAt = null;
    }
    delete data.publish; delete data.unpublish;
    const updated = await prisma.builtIn.update({
      where: { id },
      data,
      select: { id: true, title: true, status: true, updatedAt: true }
    });
    return NextResponse.json({ built: updated });
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.name === 'ZodError') return NextResponse.json({ error: e }, { status: 400 });
    }
    console.error('Update built-in error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'PROVIDER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const built = await prisma.builtIn.findUnique({ where: { id }, select: { providerId: true } });
  if (!built) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (built.providerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await prisma.builtIn.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
