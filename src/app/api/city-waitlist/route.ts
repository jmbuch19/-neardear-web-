import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const dbSchema = z.object({
  cityId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(6).max(20),
  type: z.enum(["FAMILY", "COMPANION"]),
});

const otherSchema = z.object({
  cityName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(6).max(20),
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const isOther =
    typeof raw === "object" && raw !== null && "cityName" in raw && !("cityId" in raw);

  if (isOther) {
    const parsed = otherSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }
    const { cityName, phone } = parsed.data;
    const adminEmail = process.env.ADMIN_EMAIL;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;

    if (adminEmail && fromEmail && apiKey) {
      try {
        const resend = new Resend(apiKey);
        await resend.emails.send({
          from: fromEmail,
          to: adminEmail,
          subject: `New city demand — ${cityName}`,
          html: `<p>Someone wants NearDear in <strong>${escapeHtml(cityName)}</strong>.</p><p>Phone: ${escapeHtml(phone)}</p>`,
        });
      } catch (err) {
        console.error("[city-waitlist] resend error", err);
      }
    } else {
      console.log(`[city-waitlist] new city demand: ${cityName} / ${phone}`);
    }
    return NextResponse.json({ ok: true });
  }

  const parsed = dbSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const { cityId, name, phone, type } = parsed.data;
  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) {
    return NextResponse.json({ error: "City not found" }, { status: 404 });
  }

  await prisma.cityWaitlist.create({
    data: { cityId, name, phone, type },
  });

  return NextResponse.json({ ok: true });
}
