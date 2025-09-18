import { assertProvider } from '@/lib/auth/assertProvider';
import { authOptions } from '@/lib/auth/options';
import { randomBytes } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions); 
    assertProvider(session);
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file' }, { status: 400 });
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = (file.type?.split('/')?.[1] || 'png').substring(0, 6);
    const name = `${Date.now()}_${randomBytes(4).toString('hex')}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'category');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, name), buffer);
    const publicUrl = `/uploads/category/${name}`;
    return NextResponse.json({ url: publicUrl });
  } catch (e: any) {
    const status = e.message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status });
  }
}
