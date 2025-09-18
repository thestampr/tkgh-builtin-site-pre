import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/favorites/:id - return favorite status for current user
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params; // await params per requested pattern
  // Touch dynamic APIs first
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ favorited: false });
  const userId = session.user.id;
  const existing = await prisma.favoriteBuiltIn.findUnique({ where: { userId_builtInId: { userId, builtInId: id } } });
  return NextResponse.json({ favorited: !!existing });
}

// POST /api/favorites/:id - toggle favorite for built-in id
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const existing = await prisma.favoriteBuiltIn.findUnique({ where: { userId_builtInId: { userId, builtInId: id } } });
  if (existing) {
    await prisma.favoriteBuiltIn.delete({ where: { userId_builtInId: { userId, builtInId: id } } });
    return NextResponse.json({ favorited: false });
  }
  const builtIn = await prisma.builtIn.findUnique({ where: { id } });
  if (!builtIn || builtIn.status !== 'PUBLISHED') return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.favoriteBuiltIn.create({ data: { userId, builtInId: id } });
  return NextResponse.json({ favorited: true });
}

// DELETE /api/favorites/:id - explicitly remove favorite
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  try {
    await prisma.favoriteBuiltIn.delete({ where: { userId_builtInId: { userId, builtInId: id } } });
  } catch {/* ignore */}
  return NextResponse.json({ favorited: false });
}
