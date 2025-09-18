import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  published: z.boolean().optional()
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat || !cat.published) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ category: cat });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'PROVIDER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (cat.providerId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const json = await req.json();
    const parsed = updateSchema.parse(json);
    const updated = await prisma.category.update({ where: { id }, data: parsed });
    return NextResponse.json({ category: updated });
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.name === 'ZodError') return NextResponse.json({ error: e }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'PROVIDER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const cat = await prisma.category.findUnique({ where: { id }, select: { providerId: true } });
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (cat.providerId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  // Option: check built-ins referencing category; for now restrict delete if any exist
  const count = await prisma.builtIn.count({ where: { categoryId: id } });
  if (count > 0) return NextResponse.json({ error: 'Category in use' }, { status: 400 });
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
