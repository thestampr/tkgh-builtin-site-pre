"use server";

import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const userId = session.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, profile: { select: { avatarUrl: true } } } });
  return NextResponse.json({ email: user?.email, avatarUrl: user?.profile?.avatarUrl || null });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { email } = await req.json().catch(() => ({ email: null }));
  if (!email || typeof email !== "string" || !email.includes("@")) return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  try {
    await prisma.user.update({ where: { id: session.user.id }, data: { email } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof Error && "code" in e) {
      if (e.code === "P2002") return NextResponse.json({ error: "EMAIL_IN_USE" }, { status: 409 });
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    console.error("Update profile error", e);
    return NextResponse.json({ error: "ERROR" }, { status: 500 });
  }
}
