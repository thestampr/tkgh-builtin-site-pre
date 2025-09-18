import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const BodySchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().max(500).optional().or(z.literal('').transform(() => undefined))
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;
  const profile = await prisma.profile.findUnique({ where: { userId } });
  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;
  const json = await req.json();
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  const data = parsed.data;
  const updated = await prisma.profile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: { ...data }
  });
  return NextResponse.json({ profile: updated });
}
