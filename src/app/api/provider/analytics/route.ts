import { assertProvider } from '@/lib/auth/assertProvider';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    assertProvider(session);
    const userId = session!.user.id as string;
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [events, builtIns, categories] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where: { builtIn: { providerId: userId }, type: 'BUILTIN_VIEW', createdAt: { gte: since } },
        select: { createdAt: true, builtInId: true }
      }),
      prisma.builtIn.findMany({ where: { providerId: userId }, select: { id: true, title: true, viewCount: true, categoryId: true } }),
      prisma.category.findMany({ where: { providerId: userId }, select: { id: true, name: true } })
    ]);

    // daily series
    const dayMap: Record<string, number> = {};
    for (const ev of events) {
      const key = ev.createdAt.toISOString().slice(0, 10);
      dayMap[key] = (dayMap[key] || 0) + 1;
    }
    const daily = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));

    // top built-ins (by recent events fallback to viewCount)
    const builtInEventCounts: Record<string, number> = {};
    for (const ev of events) builtInEventCounts[ev.builtInId!] = (builtInEventCounts[ev.builtInId!] || 0) + 1;
    const topBuiltIns = [...builtIns]
      .map(b => ({ id: b.id, title: b.title, recentViews: builtInEventCounts[b.id] || 0, totalViews: b.viewCount }))
      .sort((a, b) => b.recentViews - a.recentViews || b.totalViews - a.totalViews)
      .slice(0, 10);

    // category aggregation
    const catMap: Record<string, number> = {};
    for (const ev of events) {
      const b = builtIns.find(x => x.id === ev.builtInId);
      if (b?.categoryId) catMap[b.categoryId] = (catMap[b.categoryId] || 0) + 1;
    }
    const topCategories = Object.entries(catMap)
      .map(([id, value]) => ({ id, name: categories.find(c => c.id === id)?.name || 'Unknown', views: value }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    return NextResponse.json({ daily, topBuiltIns, topCategories });
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.message === 'FORBIDDEN') return NextResponse.json({ error: e.message }, { status: 403 });
      return NextResponse.json({ error: e.message || 'Error' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
