import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Header from "@/components/hero/Header";
import Footer from "@/components/hero/Footer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ElderForm from "./ElderForm";

export const metadata: Metadata = {
  title: "Add an elder profile — NearDear",
  description:
    "Tell us about the person who needs care. This helps us find the right companion for them.",
};

export const dynamic = "force-dynamic";

export default async function NewElderPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?from=/elder/new");
  }

  const cities = await prisma.city
    .findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, state: true },
    })
    .catch(() => []);

  return (
    <>
      <Header />
      <main className="bg-[#FEF8F0] min-h-screen py-12 sm:py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-3">
            ADD AN ELDER PROFILE
          </p>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl text-[#1C2B3A] leading-tight mb-3">
            Tell us about the person who needs care.
          </h1>
          <p className="text-[#1C2B3A]/75 mb-10">
            This helps us find the right companion for them.
          </p>
          <ElderForm cities={cities} />
        </div>
      </main>
      <Footer />
    </>
  );
}
