import { NextResponse } from "next/server";
import strapiFetcher from "@/lib/strapi-fetcher";
import { z } from "zod";
import nodemailer from "nodemailer";

// Validation schema for incoming payload
const schema = z.object({
  locale: z.string().optional(),
  name: z.string().min(1),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  budget: z.string().optional().or(z.literal("")),
  detail: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Validation failed" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const locale = data.locale || process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en";

    // Persist to Strapi using the wrapper
    try {
      await strapiFetcher("/api/form-submissions", "POST", undefined, {
        data: { ...data, locale },
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          ok: false,
          error: err?.message || "Failed to create form submission in Strapi",
        },
        { status: 502 }
      );
    }

    // Optional email notification
    const emailResult: { attempted: boolean; sent: boolean; error?: string } = {
      attempted: false,
      sent: false,
    };

    try {
      const {
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS,
        ESTIMATE_TO_EMAIL,
        ESTIMATE_FROM_EMAIL,
      } = process.env;

      const canSend =
        !!SMTP_HOST &&
        !!SMTP_PORT &&
        !!SMTP_USER &&
        !!SMTP_PASS &&
        !!ESTIMATE_TO_EMAIL &&
        !!ESTIMATE_FROM_EMAIL;

      if (canSend) {
        emailResult.attempted = true;

        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: Number(SMTP_PORT),
          secure: Number(SMTP_PORT) === 465,
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        });

        const html = `
          <h2>New Estimate Request</h2>
          <p><strong>Locale:</strong> ${locale}</p>
          <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
          <p><strong>Email:</strong> ${escapeHtml(data.email || "-")}</p>
          <p><strong>Location:</strong> ${escapeHtml(data.location || "-")}</p>
          <p><strong>Category:</strong> ${escapeHtml(data.category || "-")}</p>
          <p><strong>Budget:</strong> ${escapeHtml(data.budget || "-")}</p>
          <p><strong>Detail:</strong></p>
          <p>${escapeHtml(data.detail).replace(/\n/g, "<br/>")}</p>
        `;

        await transporter.sendMail({
          from: ESTIMATE_FROM_EMAIL,
          to: ESTIMATE_TO_EMAIL,
          subject: "[Website] New Estimate Request",
          html,
        });

        emailResult.sent = true;
      }
    } catch (e: unknown) {
      emailResult.sent = false;
      if (e instanceof Error) {
        emailResult.error = e.message || "Failed to send email notification";
      }
    }

    return NextResponse.json({ ok: true, email: emailResult });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 400 }
    );
  }
}

// Utility function for escaping HTML content
function escapeHtml(input: string) {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}