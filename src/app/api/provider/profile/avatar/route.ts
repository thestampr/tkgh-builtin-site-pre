import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/db/prisma';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

// Dev-only simple file writer. In production replace with S3/R2 upload.
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    const form = await request.formData();
    const file = form.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }
    const type = file.type;
    if (!['image/png','image/jpeg','image/webp'].includes(type)) {
      return NextResponse.json({ error: 'TYPE' }, { status: 400 });
    }
    if (file.size > 512 * 1024) {
      return NextResponse.json({ error: 'SIZE' }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
    const filename = `avatar_${randomBytes(6).toString('hex')}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), buffer);
    const url = `/uploads/${filename}`;
    const userId = session.user.id as string;
    // Directly persist avatarUrl (no drafts)
    const data = { avatarUrl: url };
    try {
      await prisma.profile.upsert({
        where: { userId },
        update: data,
        create: { userId, ...data }
      });
    } catch {
      // If avatarUrl column unknown (stale client) ignore
    }
    return NextResponse.json({ url });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message || 'Error' }, { status: 500 });
  }
}
