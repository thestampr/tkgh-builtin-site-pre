import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { assertProvider } from '@/lib/auth/assertProvider';
import prisma from '@/lib/db/prisma';
import { NextResponse } from 'next/server';
import { errorJson } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    assertProvider(session);
    const userId = session!.user.id as string;
    const { id } = params;
    const updated = await prisma.estimate.update({
      where: { id },
      data: { viewed: true },
      select: { id: true, viewed: true }
    });
    return NextResponse.json({ item: updated });
  } catch (e: unknown) {
    const { body, status } = errorJson(e, 'Error');
    return NextResponse.json(body, { status });
  }
}
