import UserProfileEditor from '@/components/account/UserProfileEditor';
import { ProviderChart } from '@/components/dashboard/ProviderChart';
import { getUserFavorites } from '@/lib/api';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { getTranslations } from 'next-intl/server';
import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function DashboardStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-neutral-200/70 bg-white/70 backdrop-blur p-5 flex flex-col gap-2">
      <span className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</span>
      <span className="text-xl font-semibold text-neutral-800">{value}</span>
    </div>
  );
}

export default async function AccountDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  noStore();
  const session = await getServerSession(authOptions);
  const user = session!.user;
  const userId = user.id;

  const t = await getTranslations({ locale: locale, namespace: 'Account' });
  const isProvider = user.role === 'PROVIDER';
  if (!isProvider) {
    const favorites = await getUserFavorites(userId, {locale});
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#8a6a40] via-[#a4814f] to-[#8a6a40]">{t('titleUser')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('subtitleUser')}</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-neutral-200/70 bg-white/70 backdrop-blur p-8">
            <UserProfileEditor />
          </div>
          <div className="rounded-xl border border-neutral-200/70 bg-white/70 backdrop-blur p-6 h-fit">
            <h2 className="font-medium text-sm mb-3">{t('ui.favoritesHeading')}</h2>
            {favorites.length ? (
              <ul className="space-y-2 text-sm max-h-72 overflow-auto pr-1">
                {favorites.map(f => (
                  <li key={f.id} className="flex items-center justify-between gap-2">
                    <Link className="truncate hover:underline" href={`/${locale}/p/${f.provider?.id}/built-in/${f.slug || f.id}`}>{f.title}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-neutral-400">{t('ui.noFavorites')}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Direct DB queries (mirror /api/provider/dashboard logic) to avoid cookie forwarding issues
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [counts, recent, topViews, analyticsSource] = await Promise.all([
    prisma.$transaction([
      prisma.builtIn.count({ where: { providerId: userId } }),
      prisma.builtIn.count({ where: { providerId: userId, status: 'PUBLISHED' } }),
      prisma.builtIn.count({ where: { providerId: userId, status: 'DRAFT' } }),
      prisma.category.count({ where: { providerId: userId } })
    ]),
    prisma.builtIn.findMany({ where: { providerId: userId }, orderBy: { updatedAt: 'desc' }, take: 5, select: { id: true, title: true, status: true, updatedAt: true } }),
    prisma.builtIn.findMany({ where: { providerId: userId }, orderBy: { viewCount: 'desc' }, take: 5, select: { id: true, title: true, viewCount: true, status: true } }),
    Promise.all([
      prisma.analyticsEvent.findMany({
        where: { builtIn: { providerId: userId }, type: 'BUILTIN_VIEW', createdAt: { gte: since } },
        select: { createdAt: true, builtInId: true }
      }),
      prisma.builtIn.findMany({ where: { providerId: userId }, select: { id: true, title: true, viewCount: true, categoryId: true } }),
      prisma.category.findMany({ where: { providerId: userId }, select: { id: true, name: true } })
    ])
  ]);
  // Build analytics structure mirroring /api/provider/analytics
  const [events, builtInsAll, categoriesAll] = analyticsSource;
  const dayMap: Record<string, number> = {};
  for (const ev of events) {
    const key = ev.createdAt.toISOString().slice(0, 10);
    dayMap[key] = (dayMap[key] || 0) + 1;
  }
  const daily = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
  const builtInEventCounts: Record<string, number> = {};
  for (const ev of events) builtInEventCounts[ev.builtInId!] = (builtInEventCounts[ev.builtInId!] || 0) + 1;
  const topCategories = (() => {
    const catMap: Record<string, number> = {};
    for (const ev of events) {
      const b = builtInsAll.find(x => x.id === ev.builtInId);
      if (b?.categoryId) catMap[b.categoryId] = (catMap[b.categoryId] || 0) + 1;
    }
    return Object.entries(catMap)
      .map(([id, value]) => ({ id, name: categoriesAll.find(c => c.id === id)?.name || 'Unknown', views: value }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);
  })();
  const analytics = {
    daily,
    topBuiltIns: [...builtInsAll]
      .map(b => ({ id: b.id, title: b.title, recentViews: builtInEventCounts[b.id] || 0, totalViews: b.viewCount }))
      .sort((a, b) => b.recentViews - a.recentViews || b.totalViews - a.totalViews)
      .slice(0, 10),
    topCategories
  };
  const [totalBuiltIns, publishedCount, draftCount, categoryCount] = counts;
  const data = {
    summary: { totalBuiltIns, publishedCount, draftCount, categoryCount },
    analytics,
    recent,
    topViews
  };

  return (
    <div className="md:px-6 pb-10 max-w-7xl mx-auto flex flex-col md:flex-row gap-10">
      <div className="flex-1 space-y-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#8a6a40] via-[#a4814f] to-[#8a6a40]">{t('titleProvider')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('subtitleProvider')}</p>
        </div>
        {data ? (
          <>
            <div className="grid gap-6 md:grid-cols-4">
              <DashboardStat label={t('summary.builtIns')} value={data.summary.totalBuiltIns} />
              <DashboardStat label={t('summary.published')} value={data.summary.publishedCount} />
              <DashboardStat label={t('summary.drafts')} value={data.summary.draftCount} />
              <DashboardStat label={t('summary.categories')} value={data.summary.categoryCount} />
            </div>
            <div className="grid gap-10 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <section className="rounded-xl border border-neutral-200/70 bg-white/70 backdrop-blur p-6">
                  <ProviderChart initial={data.analytics?.daily || []} />
                </section>
                <section className="rounded-xl border border-neutral-200/70 bg-white/70 backdrop-blur p-6">
                  <h2 className="font-medium mb-4 text-neutral-700">{t('tables.recent')}</h2>
                  <ul className="space-y-2 text-sm">
                    {data.recent.map((r: any) => (
                      <li key={r.id} className="flex items-center justify-between">
                        <span className="truncate mr-2">{r.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">{r.status}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
              <div className="space-y-6">
                <section className="rounded-xl border border-neutral-200/70 bg-white/70 backdrop-blur p-6 space-y-6">
                  <div>
                    <h2 className="font-medium mb-2 text-neutral-700">{t('tables.topViews')}</h2>
                    <ul className="space-y-3 text-sm">
                      {data.topViews.map((b: any) => (
                        <li key={b.id} className="flex items-center justify-between">
                          <span className="truncate mr-2">{b.title}</span>
                          <span className="text-xs font-medium text-neutral-600">{b.viewCount}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h2 className="font-medium mb-2 text-neutral-700">{t('ui.topCategories')}</h2>
                    <ul className="space-y-2 text-xs">
                      {data.analytics?.topCategories?.map((c: any) => (
                        <li key={c.id} className="flex items-center justify-between">
                          <span className="truncate mr-2">{c.name}</span>
                          <span className="text-neutral-600 font-medium">{c.views}</span>
                        </li>
                      )) || null}
                      {!data.analytics?.topCategories?.length && <li className="text-neutral-400">{t('ui.noDataGeneric')}</li>}
                    </ul>
                  </div>
                </section>
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-neutral-400">{t('empty.noData')}</div>
        )}
      </div>
    </div>
  );
}
