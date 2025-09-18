import { NextResponse } from 'next/server';

export async function POST() {
  // With NextAuth JWT strategy, signOut is handled client-side; server route can be noop
  return NextResponse.json({ ok: true });
}
