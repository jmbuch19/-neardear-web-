import type { Metadata } from "next";
import Header from "@/components/hero/Header";
import Footer from "@/components/hero/Footer";
import { prisma } from "@/lib/prisma";
import CitiesClient from "./CitiesClient";

export const metadata: Metadata = {
  title: "Where We Are — NearDear",
  description:
    "NearDear is currently serving Ahmedabad and Gandhinagar, with more cities expanding soon. Join the waitlist for your city.",
};

export const dynamic = "force-dynamic";

async function fetchCities() {
  try {
    const cities = await prisma.city.findMany({
      orderBy: [{ status: "asc" }, { sortOrder: "asc" }],
      select: { id: true, name: true, slug: true, state: true, status: true },
    });
    return cities;
  } catch {
    return [];
  }
}

export default async function CitiesPage() {
  const cities = await fetchCities();
  const active = cities.filter((c) => c.status === "ACTIVE");
  const comingSoon = cities.filter((c) => c.status === "COMING_SOON");

  return (
    <>
      <Header />
      <main>
        <section className="bg-[#1C2B3A] text-white py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#F0B429] mb-4">
              WHERE WE ARE
            </p>
            <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl leading-tight mb-5">
              Currently serving Ahmedabad and Gandhinagar.
            </h1>
            <p className="text-lg text-white/80">Expanding soon.</p>
          </div>
        </section>

        <CitiesClient active={active} comingSoon={comingSoon} />
      </main>
      <Footer />
    </>
  );
}
