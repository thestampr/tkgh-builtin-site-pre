import { assertProvider } from '@/lib/auth/assertProvider';
import { authOptions } from '@/lib/auth/options';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { uploadFiles } from '@/lib/upload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions); 
    assertProvider(session);
    const formData = await request.formData();
    const urls = await uploadFiles(formData, { folder: 'category', maxSizeMB: 2, maxCount: 1 });
    if (!urls.length) return NextResponse.json({ error: 'No file' }, { status: 400 });
    return NextResponse.json({ url: urls[0] });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Upload failed';
    const status = message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
