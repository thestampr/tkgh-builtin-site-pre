import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { errorJson } from "@/lib/errors";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		const userId = session?.user?.id;
		const body = await req.json().catch(() => ({}));
		const { locale, name, phone, email, location, category, budget, detail, providerId } = body || {};
		if (!providerId || typeof providerId !== "string") {
			return NextResponse.json({ ok: false, error: "MISSING_PROVIDER" }, { status: 400 });
		}
		if (!name || !phone || !detail) {
			return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
		}
		// Ensure provider exists
		const provider = await prisma.user.findUnique({ where: { id: providerId } });
		if (!provider || provider.role !== "PROVIDER") {
			return NextResponse.json({ ok: false, error: "INVALID_PROVIDER" }, { status: 404 });
		}

			const rec = await prisma.estimate.create({
				data: {
				locale: locale || null,
				name,
				phone,
				email: email || null,
				location: location || null,
				category: category || null,
				budget: budget || null,
				detail,
				...(userId ? { userId } : {}),
					providerId
				} as any
		});
		return NextResponse.json({ ok: true, id: rec.id });
	} catch (e: unknown) {
		const { body, status } = errorJson(e, 'ERROR');
		return NextResponse.json({ ok: false, ...body }, { status });
	}
}
