import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { z } from 'zod';
import crypto from 'crypto';

const schema = z.object({
  type: z.enum(['PAGE_VIEW', 'BUILTIN_VIEW']),
  path: z.string().min(1),
  builtInId: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = schema.parse(json);
    const session = await getServerSession(authOptions);
    const ua = req.headers.get('user-agent') || undefined;
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || '';
    const ipHash = ip ? crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32) : undefined;
    await prisma.analyticsEvent.create({
      data: {
        type: parsed.type,
        path: parsed.path,
        builtInId: parsed.builtInId,
        userId: session?.user ? session.user.id : undefined,
        userAgent: ua,
        ipHash
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.name === 'ZodError') return NextResponse.json({ error: e }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
