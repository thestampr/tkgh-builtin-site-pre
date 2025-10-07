import { assertProvider } from '@/lib/auth/assertProvider';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/db/prisma';
import { errorJson } from '@/lib/errors';
import { uploadFiles } from '@/lib/upload';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

// Helper to persist base profile fields (upsert) with special handling for ctaJson
async function saveBaseFields(body: any, userId: string) {
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
  return profile;
}

// Helper to ensure base profile id for translations
async function ensureBaseId(userId: string) {
  let base = await prisma.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!base) base = await prisma.profile.create({ data: { userId } });
  return base.id;
}

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
    const contentType = request.headers.get('content-type')?.toLowerCase() || '';

    // MULTIPART path: payload JSON + optional avatar/cover files
    if (contentType.startsWith('multipart/form-data')) {
      const form = await request.formData();
      const payloadRaw = form.get('payload');
      const body = typeof payloadRaw === 'string' ? JSON.parse(payloadRaw) : {};

      // Handle files: avatar and cover
      let avatarUrl: string | undefined;
      let coverImage: string | undefined;
      const avatar = form.get('avatar');
      if (avatar instanceof File) {
        const fd = new FormData();
        fd.append('file', avatar);
        const [url] = await uploadFiles(fd, { folder: 'avatar', maxSizeMB: 2, maxCount: 1 });
        if (url) {
          avatarUrl = url;
          body.avatarUrl = url;
        }
      }
      const cover = form.get('cover');
      if (cover instanceof File) {
        const fd = new FormData();
        fd.append('file', cover);
        const [url] = await uploadFiles(fd, { folder: 'cover', maxSizeMB: 4, maxCount: 1 });
        if (url) {
          coverImage = url;
          body.coverImage = url;
        }
      }

      // Save base fields
      const profile = await saveBaseFields(body, userId);

      // Save multi-locale translations if provided
      if (body.translations && typeof body.translations === 'object') {
        const defaultLoc = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'th';
        const profileId = await ensureBaseId(userId);
        const tasks: Promise<any>[] = [];
        for (const [locale, tr] of Object.entries(body.translations as Record<string, any>)) {
          if (!locale || locale === defaultLoc) continue;
          const t = tr as any;
          tasks.push(
            prisma.profileTranslation.upsert({
              where: { profileId_locale: { profileId, locale } },
              update: {
                displayName: t.displayName ?? undefined,
                bio: t.bio ?? undefined,
                ctaLabel: t.ctaLabel ?? undefined,
              },
              create: {
                profileId,
                locale,
                displayName: t.displayName ?? null,
                bio: t.bio ?? null,
                ctaLabel: t.ctaLabel ?? null,
              },
            })
          );
        }
        if (tasks.length) await Promise.all(tasks);
      }

      return NextResponse.json({ profile, avatarUrl, coverImage });
    }

    // JSON path: original behavior (plus optional multi-locale translations)
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
          displayName: translation.displayName ?? undefined,
          bio: translation.bio ?? undefined,
          ctaLabel: translation.ctaLabel ?? undefined,
        },
        create: {
          profileId: base.id,
          locale: translationLocale,
          displayName: translation.displayName ?? null,
          bio: translation.bio ?? null,
          ctaLabel: translation.ctaLabel ?? null
        }
      });
      return NextResponse.json({ translation: rec });
    }
    // Direct multi-field save (and optional multi-locale translations)
    const profile = await saveBaseFields(body, userId);

    if (body.translations && typeof body.translations === 'object') {
      const defaultLoc = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'th';
      const profileId = await ensureBaseId(userId);
      const tasks: Promise<any>[] = [];
      for (const [locale, tr] of Object.entries(body.translations as Record<string, any>)) {
        if (!locale || locale === defaultLoc) continue;
        const t = tr as any;
        tasks.push(
          prisma.profileTranslation.upsert({
            where: { profileId_locale: { profileId, locale } },
            update: {
              displayName: t.displayName ?? undefined,
              bio: t.bio ?? undefined,
              ctaLabel: t.ctaLabel ?? undefined,
            },
            create: {
              profileId,
              locale,
              displayName: t.displayName ?? null,
              bio: t.bio ?? null,
              ctaLabel: t.ctaLabel ?? null,
            },
          })
        );
      }
      if (tasks.length) await Promise.all(tasks);
    }

    return NextResponse.json({ profile });
  } catch (e: unknown) {
    const { body, status } = errorJson(e, 'Error');
    return NextResponse.json(body, { status });
  }
}
