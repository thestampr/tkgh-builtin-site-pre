import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { assertProvider } from '@/lib/auth/assertProvider';
import prisma from '@/lib/db/prisma';
import { NextResponse } from 'next/server';
import { errorJson } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    assertProvider(session);
    const userId = session!.user.id as string;
    const body = await req.json().catch(() => ({}));
    if (body?.action === 'list') {
      const rows = await prisma.estimate.findMany({
        where: { providerId: userId },
        include: { category: true },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ items: rows });
    }
    if (body?.action === 'bulk' && Array.isArray(body.ids) && body.ids.length) {
      const ids: string[] = body.ids;
      const op: string = body.operation;
      if (!['markViewed','archive','unarchive','delete'].includes(op)) {
        return NextResponse.json({ error: 'Unsupported bulk operation' }, { status: 400 });
      }
      if (op === 'delete') {
        await prisma.estimate.deleteMany({ where: { id: { in: ids }, providerId: userId } });
        return NextResponse.json({ ok: true, operation: op });
      }
      const data: Record<string, unknown> = {};
      if (op === 'markViewed') data.viewed = true;
      else if (op === 'archive') data.archived = true;
      else if (op === 'unarchive') data.archived = false;
      if (Object.keys(data).length) {
        await prisma.estimate.updateMany({ where: { id: { in: ids }, providerId: userId }, data });
      }
      return NextResponse.json({ ok: true, operation: op });
    }
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (e: unknown) {
    const { body, status } = errorJson(e, 'Error');
    return NextResponse.json(body, { status });
  }
}
