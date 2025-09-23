import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";
import { uploadFiles } from "@/lib/upload";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
    const type = file.type;
    if (!["image/png", "image/jpeg", "image/webp"].includes(type)) {
      return NextResponse.json({ error: "TYPE" }, { status: 400 });
    }
    const urls = await uploadFiles(form, { folder: "avatar", maxSizeMB: 2, maxCount: 1 });
    if (!urls.length) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
    const url = urls[0];
    const userId = session!.user.id;
    const data = { avatarUrl: url };
    try {
      await prisma.profile.upsert({
        where: { userId },
        update: data,
        create: { userId, ...data }
      });
    } catch (e: unknown) {
      console.error("Prisma error", e);
    }
    return NextResponse.json({ url });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    console.error("Upload avatar error", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
