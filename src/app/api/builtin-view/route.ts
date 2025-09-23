import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import crypto from 'crypto';
import { errorJson } from '@/lib/errors';

// POST /api/builtin-view { slug }
// Idempotent-ish per minute per IP+UA+slug to avoid rapid artificial inflation
export async function POST(req: Request) {
  try {
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
    const builtIn = await prisma.builtIn.findFirst({ where: { slug, status: 'PUBLISHED' }, select: { id: true } });
    if (!builtIn) return NextResponse.json({ ok: true });

    const session = await getServerSession(authOptions);
    const userId = session?.user ? session.user.id as string : null;

    const ua = (req.headers.get('user-agent') || '').slice(0,200);
    const ip = (req.headers.get('x-forwarded-for') || '')
      .split(',')[0]
      .trim();
    const minuteBucket = Math.floor(Date.now() / 60000); // coarse bucket
    const hash = crypto.createHash('sha256').update([ip, ua, slug, minuteBucket].join('|')).digest('hex');

    // Simple in-memory rate limit not possible here (serverless). Use analyticsEvent uniqueness heuristic: upsert by hash stored in ipHash+createdAt minute not guaranteed.
    // Instead, check if event exists in last minute for same builtIn & ipHash.
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recent = await prisma.analyticsEvent.findFirst({ where: { builtInId: builtIn.id, ipHash: hash, createdAt: { gte: oneMinuteAgo } }, select: { id: true } });
    if (!recent) {
      await prisma.$transaction([
        prisma.analyticsEvent.create({ data: { type: 'BUILTIN_VIEW', path: `/built-in/${slug}`, builtInId: builtIn.id, userId, userAgent: ua, ipHash: hash } }),
        prisma.builtIn.update({ where: { id: builtIn.id }, data: { viewCount: { increment: 1 } } })
      ]);
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const { body, status } = errorJson(e, 'Error');
    return NextResponse.json(body, { status });
  }
}