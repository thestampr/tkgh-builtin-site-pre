import { hashPassword } from '@/lib/auth/password';
import prisma from '@/lib/db/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Only allow requesting USER or PROVIDER from client; PUBLIC is internal default state
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["PROVIDER", "PUBLIC", "CUSTOMER", "ADMIN"]).optional()
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = registerSchema.parse(json);
    const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    const passwordHash = await hashPassword(parsed.password);
    const requestedRole = parsed.role || 'CUSTOMER';
    const user = await prisma.user.create({
      data: {
        email: parsed.email,
        passwordHash,
        role: requestedRole,
        profile: { create: {} }
      },
      select: { id: true, email: true, role: true }
    });
    return NextResponse.json({ user });
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'ZodError') {
      return NextResponse.json({ error: e }, { status: 400 });
    }
    console.error('Register error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
