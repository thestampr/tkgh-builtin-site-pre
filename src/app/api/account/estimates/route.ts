import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";
import { assertProvider } from "@/src/lib/auth/assertProvider";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    assertProvider(session);
    const providerId = session!.user.id;
    const rows = await prisma.estimate.findMany({
      where: { providerId },
      include: { provider: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ ok: true, items: rows });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: 'ERROR' }, { status: 500 });
  }
}
