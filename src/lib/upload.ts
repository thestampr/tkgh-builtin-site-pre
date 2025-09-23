import { put } from '@vercel/blob';
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

type UploadOptions = {
  folder: "builtins" | "category" | string;
  maxSizeMB: number;
  maxCount?: number;
};

const isVercel = !!process.env.VERCEL_URL || process.env.VERCEL === "1";

function getExt(file: Blob): string {
  const ext = (file.type?.split("/")?.[1] || "png").toLowerCase();
  return ext.slice(0, 8);
}

function genName(prefix: string, ext: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString("hex")}.${ext}`;
}

export async function uploadFiles(formData: FormData, opts: UploadOptions): Promise<string[]> {
  const files: Blob[] = [];
  const single = formData.get("file"); 
  if (single && single instanceof Blob) files.push(single);
  formData.getAll("files").forEach(f => { if (f instanceof Blob) files.push(f); });
  const maxCount = opts.maxCount ?? 1;
  const selected = files.slice(0, maxCount);
  const urls: string[] = [];
  for (const file of selected) {
    const sizeLimit = opts.maxSizeMB * 1024 * 1024;
    if (file.size > sizeLimit) throw new Error(`File too large (max ${opts.maxSizeMB}MB)`);
    const ext = getExt(file);
    const name = genName(opts.folder, ext);
    if (isVercel) {
      const res = await put(name, file, { access: "public", addRandomSuffix: false, contentType: file.type || undefined });
      urls.push(res.url);
    } else {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadDir = path.join(process.cwd(), "public", "uploads", opts.folder);
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, name), buffer);
        urls.push(`/uploads/${opts.folder}/${name}`);
      } catch (e: unknown) {
        console.error("File upload failed:", e);
      }
    }
  }
  return urls;
}
