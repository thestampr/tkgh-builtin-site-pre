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
    const files: Blob[] = [];
    // Accept either single 'file' or multiple 'files'
    const single = formData.get('file'); if (single && single instanceof Blob) files.push(single);
    formData.getAll('files').forEach(f => { if (f instanceof Blob) files.push(f); });
    if (!files.length) return NextResponse.json({ error: 'No files' }, { status: 400 });
    const urls: string[] = [];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'builtins');
    await mkdir(uploadDir, { recursive: true });
    for (const file of files.slice(0, 12)) { // cap 12 images
      if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 4MB each)' }, { status: 400 });
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = (file.type?.split('/')?.[1] || 'png').substring(0, 6);
      const name = `${Date.now()}_${randomBytes(4).toString('hex')}.${ext}`;
      await writeFile(path.join(uploadDir, name), buffer);
      urls.push(`/uploads/builtins/${name}`);
    }
    return NextResponse.json({ urls });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: e.message === 'FORBIDDEN' ? 403 : 500 });
  }
}
