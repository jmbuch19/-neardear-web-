import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/hero/Header";
import Footer from "@/components/hero/Footer";
import CareersForm from "./CareersForm";

export const metadata: Metadata = {
  title: "Careers — NearDear",
  description:
    "Join the NearDear team. We are a small team building a trust infrastructure for elder care in India.",
};

const VALUES = [
  {
    title: "Purpose over profit",
    body:
      "We are here because this matters. Not because it is a good market opportunity.",
  },
  {
    title: "Honesty above comfort",
    body:
      "We say hard things clearly. We do not hide behind corporate language.",
  },
  {
    title: "Deep care for the vulnerable",
    body:
      "Every decision is held against our founding principle.",
  },
  {
    title: "Builder's humility",
    body:
      "We know we do not know everything. We listen. We learn. We improve.",
  },
];

const ROLES = [
  {
    title: "Community Manager",
    location: "Ahmedabad",
    body:
      "You will be the face of NearDear to our companion community. You will onboard, support, and celebrate our companions.",
    skills: "Gujarati fluency, empathy, organisation",
  },
  {
    title: "Operations Associate",
    location: "Ahmedabad",
    body:
      "You will help manage companion verification, reference calls, and day-to-day platform operations.",
    skills: "Attention to detail, communication, Hindi/Gujarati",
  },
];

export default function CareersPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#1C2B3A] text-white py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#F0B429] mb-4">
              CAREERS
            </p>
            <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl leading-tight mb-5">
              Join the NearDear team.
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              We are a small team building something that matters. If you believe in
              what we are doing — we want to hear from you.
            </p>
          </div>
        </section>

        {/* Who we are */}
        <section className="bg-[#FAF5EC] py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-3">
              WHO WE ARE
            </p>
            <p className="text-lg text-[#1C2B3A] leading-relaxed">
              NearDear is India&rsquo;s first human-presence marketplace. We are based in
              Ahmedabad and currently in our early days. We move fast, care deeply, and
              build with purpose.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="bg-[#FEF8F0] py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-3">
                WHAT WE VALUE
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl text-[#1C2B3A]">
                The way we work.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {VALUES.map((v) => (
                <article
                  key={v.title}
                  className="rounded-2xl bg-white p-7"
                  style={{ border: "1px solid #E8E0D8" }}
                >
                  <h3 className="font-[family-name:var(--font-playfair)] text-2xl text-[#1A6B7A] mb-3">
                    {v.title}
                  </h3>
                  <p className="text-[#1C2B3A]/85 leading-relaxed">{v.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Open roles */}
        <section className="bg-white py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="mb-10">
              <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-3">
                OPEN ROLES
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl text-[#1C2B3A]">
                Currently hiring
              </h2>
            </div>
            <div className="space-y-5">
              {ROLES.map((r) => (
                <article
                  key={r.title}
                  className="rounded-2xl p-7"
                  style={{ border: "1px solid #E8E0D8", background: "#FEF8F0" }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3 mb-3">
                    <h3 className="font-[family-name:var(--font-playfair)] text-2xl text-[#1C2B3A]">
                      {r.title}
                    </h3>
                    <p className="text-sm font-semibold uppercase tracking-wider text-[#E07B2F]">
                      {r.location}
                    </p>
                  </div>
                  <p className="text-[#1C2B3A]/85 leading-relaxed mb-3">{r.body}</p>
                  <p className="text-sm text-[#1C2B3A]/70 mb-5">
                    <strong>Skills:</strong> {r.skills}
                  </p>
                  <a
                    href={`#express-interest`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#1A6B7A] hover:underline"
                  >
                    Express interest <span aria-hidden="true">→</span>
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Open form */}
        <section id="express-interest" className="bg-[#FAF5EC] py-20 px-4 scroll-mt-12">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-3">
                DON&rsquo;T SEE YOUR ROLE?
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl text-[#1C2B3A] mb-3">
                We are growing. Tell us who you are.
              </h2>
            </div>
            <CareersForm />
          </div>
        </section>

        {/* Companions */}
        <section className="bg-[#FEF8F0] py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl text-[#1C2B3A] mb-4">
              Not looking for a staff role?
            </h2>
            <p className="text-[#1C2B3A]/80 mb-7">
              You can still be part of NearDear as a verified companion.
            </p>
            <Link
              href="/provider/apply"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
              style={{ background: "#4A8C6F" }}
            >
              Apply as companion →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
