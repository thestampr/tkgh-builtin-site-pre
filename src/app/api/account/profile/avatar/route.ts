import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import prisma from '@/lib/db/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    const form = await req.formData();
    const file = form.get('file');
    if (!file || !(file instanceof File)) return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    const type = file.type;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(type)) return NextResponse.json({ error: 'TYPE' }, { status: 400 });
    if (file.size > 512 * 1024) return NextResponse.json({ error: 'SIZE' }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
    const filename = `uav_${randomBytes(6).toString('hex')}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), bytes);
    const url = `/uploads/${filename}`;
    const userId = session.user.id as string;
    await prisma.profile.upsert({
      where: { userId },
      update: { avatarUrl: url },
      create: { userId, avatarUrl: url }
    });
    return NextResponse.json({ url });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    console.error('Upload avatar error', e);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
