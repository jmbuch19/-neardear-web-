import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/hero/Header";
import Footer from "@/components/hero/Footer";

export const metadata: Metadata = {
  title: "How We Keep Everyone Safe — NearDear",
  description:
    "Three layers of verification. Identity, character, and ongoing integrity checks for every NearDear companion, every time.",
};

const IDENTITY_ITEMS = [
  "Aadhaar number confirmed through the government API",
  "Live selfie captured and matched to their ID",
  "Residential address verified",
  "Police Clearance Certificate reviewed by our team",
  "Renewed every 12 months",
];

const CHARACTER_ITEMS = [
  "Two personal references contacted by phone — not family members",
  "Structured 5-question call with each reference",
  "Video interview with NearDear team",
  "We assess: empathy, communication, boundary awareness, and how they respond to difficult situations",
  "Signed Code of Conduct before first session",
];

const ONGOING_ITEMS = [
  "GPS check-in on every home visit",
  "GPS check-out on every home visit",
  "Structured session note after every visit — reviewed by platform",
  "Family feedback collected after every session",
  "Random platform calls to families",
  "Annual re-verification required",
  "Concern flagging always open",
];

const TRUST_LEVELS = [
  {
    level: "LEVEL 0",
    title: "New Companion",
    unlock: "Remote sessions only",
    services: "Voice and video calls. Talk support, student guidance.",
  },
  {
    level: "LEVEL 1",
    title: "Field Verified",
    unlock: "After 5 sessions + positive feedback",
    services:
      "Public place meetings. Medicine pickup, bank help, government office visits.",
  },
  {
    level: "LEVEL 2",
    title: "Home Trusted",
    unlock: "After 10 sessions + admin review",
    services:
      "Home visits enabled. Elder support, companion visits, hospital guidance.",
  },
  {
    level: "LEVEL 3",
    title: "Senior Companion",
    unlock: "After 25 sessions + 6 months",
    services:
      "All services unlocked. Live-in care, recurring elder care. Our most trusted companions.",
  },
];

const PROTOCOL_STEPS = [
  {
    n: "1",
    title: "Companion arrives",
    bullets: [
      "Checks in on app",
      "GPS location logged",
      'YOU are notified instantly: "[Name] has arrived. 10:03 AM"',
    ],
  },
  {
    n: "2",
    title: "Session happens",
    bullets: [
      "Duration tracked live",
      "Hard rules active",
      "Emergency flag always available",
    ],
  },
  {
    n: "3",
    title: "Companion leaves",
    bullets: [
      "Checks out on app",
      "GPS logged",
      "Must submit session note before session closes",
    ],
  },
  {
    n: "4",
    title: "You receive the note",
    bullets: [
      "What they did",
      "How your parent seemed",
      "Any observation, any concern",
      "Delivered to you instantly",
    ],
  },
  {
    n: "5",
    title: "You confirm",
    bullets: [
      "24-hour window to flag concern",
      "Auto-confirmed if no action",
      "Payment released after confirmation",
    ],
  },
];

const HARD_RULES = [
  {
    title: "No cash — ever",
    body: "All payments through platform only. Cash acceptance = immediate suspension.",
  },
  {
    title: "No gifts",
    body: "Companions must decline. Persistent gifting reported to admin.",
  },
  {
    title: "No personal financial information",
    body: "No bank details, passwords, or PINs. Ever. Violation = permanent removal.",
  },
  {
    title: "No outside contact",
    body: "No personal WhatsApp or phone numbers. All contact through platform only.",
  },
  {
    title: "Presence and errands only",
    body: "Not medical. Not legal. Not financial. Observations reported. Not acted upon.",
  },
  {
    title: "Report. Do not act.",
    body: "Medical concerns reported through platform. Emergency: call 112 first.",
  },
  {
    title: "No decisions on behalf of elder",
    body: "No signing. No consenting. No independent decision-making.",
  },
];

const DISPUTE_TIERS = [
  {
    label: "LOW CONCERN",
    sla: "Reviewed within 48 hours",
    examples: "Session quality, punctuality issues",
    accent: "#1A6B7A",
  },
  {
    label: "MEDIUM CONCERN",
    sla: "Reviewed within 24 hours",
    examples: "Incomplete sessions, scope violations",
    accent: "#E07B2F",
  },
  {
    label: "HIGH CONCERN",
    sla: "Reviewed within 4 hours",
    examples:
      "Safety issues, conduct violations. Account suspended immediately pending review.",
    accent: "#E85D4A",
  },
];

function ShieldIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartPersonIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 21c0-3.5 3-6 7-6s7 2.5 7 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 11.5c-.6-.7-1.7-1-2.5-.5-.9.6-1 1.9-.2 2.6.6.6 1.6 1.4 2.7 2 1.1-.6 2.1-1.4 2.7-2 .8-.7.7-2-.2-2.6-.8-.5-1.9-.2-2.5.5z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CheckList({ items, color }: { items: string[]; color: string }) {
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it} className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-1 inline-flex items-center justify-center shrink-0 rounded-full"
            style={{
              width: 18,
              height: 18,
              background: color,
              border: `1.5px solid ${color}`,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-[15px] leading-relaxed">{it}</span>
        </li>
      ))}
    </ul>
  );
}

export default function SafetyPage() {
  return (
    <>
      <Header />
      <main>
        {/* SECTION 1 — Founding Commitment */}
        <section className="bg-[#1C2B3A] text-white py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#F0B429] mb-6">
              HOW WE KEEP EVERYONE SAFE
            </p>
            <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl leading-tight mb-8">
              Three layers of verification. Every companion. Every time.
            </h1>
            <blockquote className="text-xl sm:text-2xl font-[family-name:var(--font-playfair)] italic leading-snug mt-12 mb-6 text-white/90">
              &ldquo;How do we create a platform where vulnerable people can receive
              human help with the maximum possible safety, traceability, dignity, and
              accountability?&rdquo;
            </blockquote>
            <p className="text-base text-white/70 max-w-2xl mx-auto">
              This is not a tagline. It is the question every feature, every policy,
              and every decision on NearDear is held against.
            </p>
          </div>
        </section>

        {/* SECTION 2 — Three Verifications */}
        <section className="bg-[#FAF5EC] py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-3">
                THE THREE VERIFICATIONS
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl text-[#1C2B3A]">
                Identity. Character. Ongoing integrity.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card X — Identity */}
              <article className="rounded-2xl p-7 text-white" style={{ background: "#1A6B7A" }}>
                <div className="text-white mb-4"><ShieldIcon /></div>
                <h3 className="font-[family-name:var(--font-playfair)] text-2xl mb-2">
                  Identity verification
                </h3>
                <p className="text-sm text-white/80 mb-6">
                  Before anyone joins NearDear as a companion, we verify:
                </p>
                <CheckList items={IDENTITY_ITEMS} color="#F0B429" />
                <p className="mt-6 pt-5 border-t border-white/15 text-sm text-white/80">
                  Full Aadhaar number is never stored. Only last 4 digits. Always.
                </p>
              </article>

              {/* Card Y — Character */}
              <article className="rounded-2xl p-7 text-white" style={{ background: "#4A8C6F" }}>
                <div className="text-white mb-4"><HeartPersonIcon /></div>
                <h3 className="font-[family-name:var(--font-playfair)] text-2xl mb-2">
                  Character verification
                </h3>
                <p className="text-sm text-white/80 mb-6">
                  We go beyond documents:
                </p>
                <CheckList items={CHARACTER_ITEMS} color="#F0B429" />
              </article>

              {/* Card Z — Ongoing */}
              <article className="rounded-2xl p-7 text-white" style={{ background: "#E07B2F" }}>
                <div className="text-white mb-4"><EyeIcon /></div>
                <h3 className="font-[family-name:var(--font-playfair)] text-2xl mb-2">
                  Ongoing integrity
                </h3>
                <p className="text-sm text-white/80 mb-6">
                  Verification does not stop at onboarding:
                </p>
                <CheckList items={ONGOING_ITEMS} color="#1C2B3A" />
              </article>
            </div>
          </div>
        </section>

        {/* SECTION 3 — Trust Ladder */}
        <section className="bg-[#FEF8F0] py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-3">
                THE TRUST LADDER
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl text-[#1C2B3A] mb-4">
                Trust is earned. Not granted.
              </h2>
              <p className="text-[#1C2B3A]/80 max-w-2xl mx-auto">
                A new companion does not walk into someone&rsquo;s home on Day 1.
                Access is earned in stages.
              </p>
            </div>
            <ol className="space-y-4">
              {TRUST_LEVELS.map((lvl, i) => (
                <li
                  key={lvl.level}
                  className="rounded-2xl bg-white p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6"
                  style={{
                    border: "1px solid #E8E0D8",
                    marginLeft: `${i * 16}px`,
                  }}
                >
                  <div
                    className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl shrink-0 sm:w-32"
                    style={{ color: "#1A6B7A" }}
                  >
                    {lvl.level}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-[#1C2B3A]">{lvl.title}</p>
                    <p className="text-sm font-medium mt-1" style={{ color: "#E07B2F" }}>
                      {lvl.unlock}
                    </p>
                    <p className="text-sm text-[#1C2B3A]/70 mt-2">{lvl.services}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* SECTION 4 — Session Protocol */}
        <section className="bg-white py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-3">
                SESSION PROTOCOL
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl text-[#1C2B3A]">
                Every session. Every time.
              </h2>
            </div>
            <ol className="relative border-l-2 border-[#E8E0D8] pl-8 space-y-10">
              {PROTOCOL_STEPS.map((s) => (
                <li key={s.n} className="relative">
                  <span
                    className="absolute -left-[42px] flex items-center justify-center font-[family-name:var(--font-playfair)] text-white text-lg rounded-full"
                    style={{ width: 36, height: 36, background: "#1A6B7A" }}
                  >
                    {s.n}
                  </span>
                  <h3 className="font-[family-name:var(--font-playfair)] text-xl text-[#1C2B3A] mb-2">
                    {s.title}
                  </h3>
                  <ul className="space-y-1.5 text-[#1C2B3A]/80 text-[15px]">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span className="text-[#1A6B7A]">→</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* SECTION 5 — Seven Hard Rules */}
        <section className="bg-[#FEF8F0] py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-3">
                THE SEVEN HARD RULES
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl text-[#1C2B3A] mb-4">
                Rules every companion signs. Rules we enforce.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {HARD_RULES.map((rule, i) => (
                <article
                  key={rule.title}
                  className="rounded-2xl bg-white p-6"
                  style={{ border: "1px solid #E8E0D8" }}
                >
                  <p
                    className="font-[family-name:var(--font-playfair)] text-3xl mb-3"
                    style={{ color: "#E07B2F" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="font-semibold text-[#1C2B3A] text-lg mb-2">
                    {rule.title}
                  </h3>
                  <p className="text-sm text-[#1C2B3A]/75 leading-relaxed">{rule.body}</p>
                </article>
              ))}
            </div>
            <p className="text-center text-sm text-[#1C2B3A]/70 mt-10 italic">
              Violation of any rule: immediate suspension + investigation.
            </p>
          </div>
        </section>

        {/* SECTION 6 — Dispute Protection */}
        <section className="bg-white py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-3">
                DISPUTE PROTECTION
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl text-[#1C2B3A]">
                When something goes wrong — we respond.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              {DISPUTE_TIERS.map((t) => (
                <article
                  key={t.label}
                  className="rounded-2xl p-6 bg-[#FAF5EC]"
                  style={{ borderTop: `4px solid ${t.accent}` }}
                >
                  <p
                    className="text-xs font-semibold tracking-widest uppercase mb-3"
                    style={{ color: t.accent }}
                  >
                    {t.label}
                  </p>
                  <p className="font-semibold text-[#1C2B3A] text-lg mb-2">{t.sla}</p>
                  <p className="text-sm text-[#1C2B3A]/75 leading-relaxed">
                    {t.examples}
                  </p>
                </article>
              ))}
            </div>
            <p className="text-center text-[#1C2B3A]/85 max-w-2xl mx-auto">
              We protect both sides. Companions are protected from false claims.
              Families are protected from misconduct. The platform holds everyone
              accountable.
            </p>
          </div>
        </section>

        {/* SECTION 7 — Honest Acknowledgement */}
        <section className="bg-[#1C2B3A] text-white py-24 px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <p className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl leading-snug">
              After all of this — yes. You are still dealing with human beings. Some
              may disappoint.
            </p>
            <p className="text-lg text-white/80 leading-relaxed">
              But this system makes bad behaviour structurally costly, visible, and
              consequential. And it makes good behaviour the natural path for good
              people.
            </p>
            <p className="text-lg text-white/90 font-semibold">
              That is the most a platform can do. We do it without compromise.
            </p>
          </div>
        </section>

        {/* SECTION 8 — CTA */}
        <section className="bg-[#FEF8F0] py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl text-[#1C2B3A] mb-8">
              Ready to find a trusted companion?
            </h2>
            <Link
              href="/request/new"
              className="inline-block rounded-full px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
              style={{ background: "#E07B2F" }}
            >
              Find a NearDear
            </Link>

            <div className="mt-14 pt-12 border-t border-[#E8E0D8]">
              <h3 className="font-[family-name:var(--font-playfair)] text-2xl text-[#1C2B3A] mb-6">
                Want to become a verified companion?
              </h3>
              <Link
                href="/provider/apply"
                className="inline-block rounded-full px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
                style={{ background: "#4A8C6F" }}
              >
                Start Your Application
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
