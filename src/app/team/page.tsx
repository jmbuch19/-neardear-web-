import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/hero/Header";
import Footer from "@/components/hero/Footer";

export const metadata: Metadata = {
  title: "The People Behind NearDear",
  description:
    "Founders' note, founding team, and an open invitation to join us. NearDear is built by people who understand the gap it fills.",
};

export default function TeamPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#1C2B3A] text-white py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#F0B429] mb-4">
              THE TEAM
            </p>
            <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl leading-tight">
              The people behind NearDear.
            </h1>
          </div>
        </section>

        {/* Founder's note */}
        <section className="bg-[#FAF5EC] py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-4">
              A NOTE FROM THE FOUNDER
            </p>
            <div className="space-y-5 text-lg leading-relaxed text-[#1C2B3A]">
              <p>
                NearDear was founded in Ahmedabad by people who have seen this gap
                personally.
              </p>
              <p>
                We are not building this from a pitch deck or a market analysis. We are
                building it from understanding — of what it means to age, to be far from
                the people you love, and to need someone near.
              </p>
              <p>
                We are a small team. We may make mistakes. But we will never compromise
                on the founding principle that guides every decision we make.
              </p>
            </div>
          </div>
        </section>

        {/* Founding team */}
        <section className="bg-[#FEF8F0] py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-3">
              FOUNDING TEAM
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl text-[#1C2B3A] mb-8">
              The people building NearDear today.
            </h2>
            <article
              className="rounded-2xl bg-white p-8"
              style={{ border: "1px solid #E8E0D8" }}
            >
              <h3 className="font-[family-name:var(--font-playfair)] text-2xl text-[#1C2B3A]">
                Jaydeep Buch
              </h3>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#E07B2F] mt-1">
                Founder
              </p>
              <p className="text-sm text-[#1C2B3A]/70 mt-1">Ahmedabad, Gujarat</p>
              <p className="mt-5 italic text-[#1C2B3A] leading-relaxed">
                &ldquo;Building NearDear because I understand the gap it fills.&rdquo;
              </p>
              <a
                href="mailto:jaydeep@neardear.in"
                className="inline-block mt-5 text-sm font-semibold text-[#1A6B7A] hover:underline"
              >
                jaydeep@neardear.in
              </a>
            </article>
          </div>
        </section>

        {/* Join us */}
        <section className="bg-white py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl text-[#1C2B3A] mb-4">
              We are looking for people who care.
            </h2>
            <Link
              href="/careers"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
              style={{ background: "#4A8C6F" }}
            >
              View open roles →
            </Link>
          </div>
        </section>

        {/* Companions */}
        <section className="bg-[#FEF8F0] py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-4">
              OUR COMPANIONS
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl text-[#1C2B3A] leading-snug mb-6">
              The real team is our companion community — the Manjubens and Rameshbhais
              of Ahmedabad and Gandhinagar who show up every day.
            </h2>
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors"
              style={{ border: "1.5px solid #1A6B7A", color: "#1A6B7A" }}
            >
              Meet our companions →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
