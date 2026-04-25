import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  ageRange: z.string().trim().min(1).max(40),
  primaryLanguage: z.string().trim().min(1).max(40),
  mobilityLevel: z.string().trim().max(40).optional().or(z.literal("")),
  personalCareNeeds: z.array(z.string()).optional().default([]),
  medicalEquipment: z.array(z.string()).optional().default([]),
  healthNotes: z.string().trim().max(2000).optional().or(z.literal("")),
  emergencyName: z.string().trim().min(1).max(120),
  emergencyContact: z.string().trim().min(6).max(20),
  genderPreference: z.enum(["FEMALE", "MALE", "NO_PREFERENCE"]).default("NO_PREFERENCE"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid submission" },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const elder = await prisma.elderProfile.create({
    data: {
      familyUserId: session.user.id,
      name: d.name,
      city: d.city,
      phone: d.phone || null,
      ageRange: d.ageRange,
      primaryLanguage: d.primaryLanguage,
      mobilityLevel: d.mobilityLevel || null,
      personalCareNeeds: d.personalCareNeeds,
      medicalEquipment: d.medicalEquipment,
      healthNotes: d.healthNotes || null,
      emergencyName: d.emergencyName,
      emergencyContact: d.emergencyContact,
      genderPreference: d.genderPreference,
    },
    select: { id: true, name: true },
  });

  return NextResponse.json({ ok: true, elder });
}
