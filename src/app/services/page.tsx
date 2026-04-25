import type { Metadata } from "next";
import Header from "@/components/hero/Header";
import Footer from "@/components/hero/Footer";
import { prisma } from "@/lib/prisma";
import ServicesClient from "./ServicesClient";

export const metadata: Metadata = {
  title: "Our Services — NearDear",
  description:
    "Care for every situation. Browse all NearDear services across Presence, Navigation, Continuity, and Connection.",
};

export const dynamic = "force-dynamic";

async function fetchServices() {
  try {
    return await prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        cluster: true,
        mode: true,
        descriptionReceiver: true,
        suggestedFeeMin: true,
        suggestedFeeMax: true,
        minTrustLevel: true,
      },
    });
  } catch (err) {
    console.error("[/services] fetchServices failed", err);
    return [];
  }
}

export default async function ServicesPage() {
  const services = await fetchServices();

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#1C2B3A] text-white py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#F0B429] mb-4">
              OUR SERVICES
            </p>
            <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl leading-tight mb-5">
              Care for every situation
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              From a quiet afternoon visit to full-time elder care — NearDear has a
              verified companion for every need.
            </p>
          </div>
        </section>

        <ServicesClient services={services} />
      </main>
      <Footer />
    </>
  );
}
