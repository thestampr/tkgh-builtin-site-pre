import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { currentPassword, newPassword } = await req.json().catch(() => ({ currentPassword: '', newPassword: '' }));
  if (!newPassword || newPassword.length < 8) return NextResponse.json({ error: 'WEAK_PASSWORD' }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  const valid = await bcrypt.compare(currentPassword || '', user.passwordHash);
  if (!valid) return NextResponse.json({ error: 'INVALID_CURRENT' }, { status: 400 });
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
  return NextResponse.json({ ok: true });
}