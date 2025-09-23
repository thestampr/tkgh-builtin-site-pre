import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ items: [] });
  const userId = session.user.id;
  const favorites = await prisma.favoriteBuiltIn.findMany({
    where: { userId },
    include: { builtIn: { select: { id: true, title: true, slug: true, coverImage: true, price: true, status: true } } },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json({
    items: favorites.map(f => ({
      id: f.builtIn.id,
      title: f.builtIn.title,
      slug: f.builtIn.slug,
      coverImage: f.builtIn.coverImage,
      price: f.builtIn.price,
      status: f.builtIn.status,
      favoritedAt: f.createdAt
    }))
  });
}
