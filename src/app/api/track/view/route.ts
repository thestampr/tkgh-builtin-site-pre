import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import crypto from 'crypto';
import { errorJson } from '@/lib/errors';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? session.user.id : undefined;
    const { builtInId, path } = await request.json();
    if (!builtInId && !path) {
      return NextResponse.json({ error: 'Missing builtInId or path' }, { status: 400 });
    }
    const ua = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);

    // Insert analytics event
    const evt = await prisma.analyticsEvent.create({
      data: {
        type: builtInId ? 'BUILTIN_VIEW' : 'PAGE_VIEW',
        path: path || `/builtin/${builtInId}`,
        userId: userId || null,
        builtInId: builtInId || null,
        userAgent: ua.slice(0, 255),
        ipHash
      }
    });

    if (builtInId) {
      // Best effort increment (no transaction needed for simple count)
      await prisma.builtIn.update({
        where: { id: builtInId },
        data: { viewCount: { increment: 1 } }
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, eventId: evt.id });
  } catch (e: unknown) {
    const { body, status } = errorJson(e, 'Error');
    return NextResponse.json(body, { status });
  }
}
