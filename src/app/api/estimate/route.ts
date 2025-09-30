import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

interface FormData {
	locale?: string;
	name: string;
	phone: string;
	email?: string;
	location?: string;
	categoryId?: string;
	budget?: string;
	detail: string;
	providerId?: string;
}

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		const userId = session?.user?.id;
		const body = await req.json().catch(() => ({}));
		const { locale, name, phone, email, location, categoryId, budget, detail, providerId } = body as FormData;
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
		// Ensure category exists
		const category = categoryId ? await prisma.category.findUnique({ where: { id: categoryId } }) : null;
		if (categoryId && !category) {
			return NextResponse.json({ ok: false, error: "INVALID_CATEGORY" }, { status: 404 });
		}

		const rec = await prisma.estimate.create({
			data: {
				locale,
				name,
				phone,
				email,
				location,
				budget,
				detail,
				userId,
				categoryId: categoryId!,
				providerId: providerId!,
			}
		});
		return NextResponse.json({ ok: true, id: rec.id });
	} catch (e: unknown) {
		return NextResponse.json({ ok: false, error: "UNKNOWN_ERROR" }, { status: 500 });
	}
}
