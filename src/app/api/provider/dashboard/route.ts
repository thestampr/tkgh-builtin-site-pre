import { assertProvider } from '@/lib/auth/assertProvider';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { errorJson } from '@/lib/errors';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    assertProvider(session);
    const userId = session!.user.id as string;

    const [counts, topViews, recent, agg] = await Promise.all([
      prisma.$transaction([
        prisma.builtIn.count({ where: { providerId: userId } }),
        prisma.builtIn.count({ where: { providerId: userId, status: 'PUBLISHED' } }),
        prisma.builtIn.count({ where: { providerId: userId, status: 'DRAFT' } }),
        prisma.category.count({ where: { providerId: userId } })
      ]),
      prisma.builtIn.findMany({ where: { providerId: userId }, orderBy: { viewCount: 'desc' }, take: 5, select: { id: true, title: true, viewCount: true, status: true } }),
      prisma.builtIn.findMany({ where: { providerId: userId }, orderBy: { updatedAt: 'desc' }, take: 5, select: { id: true, title: true, status: true, updatedAt: true } }),
      prisma.builtIn.findMany({ where: { providerId: userId }, select: { id: true, viewCount: true, _count: { select: { favorites: true } } } })
    ]);

    const [totalBuiltIns, publishedCount, draftCount, categoryCount] = counts;

    // Views last 14 days (simple group by date)
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const raw = await prisma.analyticsEvent.findMany({
      where: { builtIn: { providerId: userId }, type: 'BUILTIN_VIEW', createdAt: { gte: since } },
      select: { createdAt: true }
    });
    const seriesMap: Record<string, number> = {};
    for (const r of raw) {
      const d = r.createdAt.toISOString().slice(0, 10);
      seriesMap[d] = (seriesMap[d] || 0) + 1;
    }
    const series = Object.entries(seriesMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));

    const totalViews = agg.reduce((s, b) => s + (b.viewCount || 0), 0);
    const totalFavorites = agg.reduce((s, b) => s + (b._count?.favorites || 0), 0);
    const topFavorites = [...agg]
      .sort((a, b) => (b._count?.favorites || 0) - (a._count?.favorites || 0))
      .slice(0, 5)
      .map(b => ({ id: b.id, favorites: b._count?.favorites || 0, viewCount: b.viewCount }));
    return NextResponse.json({
      summary: { totalBuiltIns, publishedCount, draftCount, categoryCount, totalViews, totalFavorites },
      topViews,
      topFavorites,
      recent,
      views14d: series
    });
  } catch (e: unknown) {
    const { body, status } = errorJson(e, 'Error');
    return NextResponse.json(body, { status });
  }
}
