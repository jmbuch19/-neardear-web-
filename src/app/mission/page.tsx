import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/hero/Header";
import Footer from "@/components/hero/Footer";

export const metadata: Metadata = {
  title: "Our Mission — NearDear",
  description:
    "Why NearDear exists. The wound we are responding to. The founding principle. The promise.",
};

const FOUR_WORDS = [
  {
    label: "SAFETY",
    body: "Verified identity, verified character, GPS-tracked sessions. Companions earn access to homes in stages — never on Day 1.",
  },
  {
    label: "TRACEABILITY",
    body: "Every session is timestamped. Every visit has a note. Nothing happens off the record. The platform remembers, so families do not have to chase.",
  },
  {
    label: "DIGNITY",
    body: "Companions are paid fairly — 80% of every fee. Elders are spoken to as people, not patients. Families are kept in the loop, never left guessing.",
  },
  {
    label: "ACCOUNTABILITY",
    body: "Concerns are flagged. Reports are reviewed. High-severity issues are acted on within 4 hours. Bad behaviour is structurally costly here.",
  },
];

const WOUND_BULLETS = [
  "Children migrate to Bengaluru, Dubai, Toronto. Parents stay behind.",
  "Joint families dissolve.",
  "140 million Indians above 60. Majority without nearby family support.",
  "Loneliness — the fastest growing health crisis of our generation.",
];

export default function MissionPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#1C2B3A] text-white py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#F0B429] mb-4">
              OUR MISSION
            </p>
            <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl leading-tight">
              The soul of the platform.
            </h1>
          </div>
        </section>

        {/* The wound */}
        <section className="bg-[#FAF5EC] py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-3">
              THE WOUND WE ARE RESPONDING TO
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl text-[#1C2B3A] leading-tight mb-8">
              Something quiet and devastating is happening around us. It has no single
              name. But you can see it everywhere.
            </h2>
            <ul className="space-y-3">
              {WOUND_BULLETS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[#1C2B3A] leading-relaxed">
                  <span className="text-[#1A6B7A] mt-1 shrink-0">→</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Founding principle */}
        <section className="py-20 px-4" style={{ background: "#1C2B3A" }}>
          <div className="max-w-3xl mx-auto">
            <div
              className="rounded-2xl p-8 sm:p-12 text-center"
              style={{
                background: "rgba(240, 180, 41, 0.08)",
                border: "1px solid rgba(240, 180, 41, 0.4)",
              }}
            >
              <p className="text-xs font-semibold tracking-widest uppercase text-[#F0B429] mb-5">
                THE FOUNDING PRINCIPLE
              </p>
              <blockquote className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl italic leading-snug text-white">
                &ldquo;How do we create a platform where vulnerable people can receive
                human help with the maximum possible safety, traceability, dignity, and
                accountability?&rdquo;
              </blockquote>
            </div>
          </div>
        </section>

        {/* Four words */}
        <section className="bg-[#FEF8F0] py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-3">
                FOUR WORDS
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl text-[#1C2B3A]">
                Every feature is held against these.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {FOUR_WORDS.map((w) => (
                <article
                  key={w.label}
                  className="rounded-2xl bg-white p-7"
                  style={{ border: "1px solid #E8E0D8" }}
                >
                  <p className="font-[family-name:var(--font-playfair)] text-3xl text-[#1A6B7A] mb-3">
                    {w.label}
                  </p>
                  <p className="text-[#1C2B3A]/85 leading-relaxed">{w.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* What we are building */}
        <section className="bg-white py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-3">
              WHAT WE ARE BUILDING
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl text-[#1C2B3A] leading-snug">
              Not just a platform.{" "}
              <span style={{ color: "#E07B2F" }}>A trust infrastructure.</span>
            </h2>
          </div>
        </section>

        {/* Promise */}
        <section className="bg-[#1C2B3A] text-white py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#F0B429] mb-5">
              THE PROMISE
            </p>
            <p className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl leading-snug">
              In the age of AI — someone human will still be there for you.
            </p>
          </div>
        </section>

        {/* CTAs */}
        <section className="bg-[#FEF8F0] py-16 px-4">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors"
              style={{ border: "1.5px solid #1A6B7A", color: "#1A6B7A" }}
            >
              Read our full story
            </Link>
            <Link
              href="/request/new"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
              style={{ background: "#E07B2F" }}
            >
              Find a NearDear
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
