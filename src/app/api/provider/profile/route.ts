import { assertProvider } from '@/lib/auth/assertProvider';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { errorJson } from '@/lib/errors';

// GET: fetch provider profile (live only)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    assertProvider(session);
    const userId = session!.user.id as string;
    const { searchParams } = new URL(request.url);
    const includeTranslations = searchParams.get('withTranslations') === '1';
    const profile = await prisma.profile.findUnique({
      where: { userId },
      ...(includeTranslations ? { include: { translations: true } } : {})
    });
    return NextResponse.json({ profile });
  } catch (e: unknown) {
    const { body, status } = errorJson(e, 'Error');
    return NextResponse.json(body, { status });
  }
}

// PUT: update live fields directly (no drafts)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    assertProvider(session);
    const userId = session!.user.id as string;
    const body = await request.json();
    const translationLocale = body.translationLocale as string | undefined;
    const translation = body.translation as any | undefined;
    if (translationLocale && translation) {
      // Ensure base profile exists and we have its id
      let base = await prisma.profile.findUnique({ where: { userId }, select: { id: true } });
      if (!base) {
        base = await prisma.profile.create({ data: { userId } });
      }
      const rec = await prisma.profileTranslation.upsert({
        where: { profileId_locale: { profileId: base.id, locale: translationLocale } },
        update: {
          displayName: translation.displayName ?? null,
          bio: translation.bio ?? null,
          ctaLabel: translation.ctaLabel ?? null,
          published: translation.published ?? false
        },
        create: {
          profileId: base.id,
          locale: translationLocale,
          displayName: translation.displayName ?? null,
          bio: translation.bio ?? null,
          ctaLabel: translation.ctaLabel ?? null,
          published: translation.published ?? false
        }
      });
      return NextResponse.json({ translation: rec });
    }
    // Direct save
    const data: any = {};
    ['displayName', 'bio', 'avatarUrl', 'contactJson', 'coverImage'].forEach(k => {
      if (body[k] !== undefined) data[k] = body[k] === '' ? null : body[k];
    });
    // Keep exact ctaJson string (including empty-label JSON) without coercing empty string to null
    if (body.ctaJson !== undefined) data.ctaJson = body.ctaJson;
    let profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await prisma.profile.create({ data: { userId, ...data } });
    } else {
      // handle ctaJson separately if schema client stale
      if ('ctaJson' in data) {
        try {
          profile = await prisma.profile.update({ where: { userId }, data });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          if (/Unknown argument `ctaJson`/i.test(msg)) {
            const { ctaJson, ...rest } = data;
            profile = await prisma.profile.update({ where: { userId }, data: rest });
            try { await prisma.$executeRawUnsafe(`UPDATE Profile SET ctaJson = ? WHERE userId = ?`, ctaJson, userId); } catch {/* ignore */ }
            profile = await prisma.profile.findUnique({ where: { userId } });
          } else {
            throw e;
          }
        }
      } else {
        profile = await prisma.profile.update({ where: { userId }, data });
      }
    }
    return NextResponse.json({ profile });
  } catch (e: unknown) {
    const { body, status } = errorJson(e, 'Error');
    return NextResponse.json(body, { status });
  }
}
