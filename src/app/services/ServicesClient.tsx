"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Cluster = "PRESENCE" | "NAVIGATION" | "CONTINUITY" | "CONNECTION" | "PROFESSIONAL_ADVISORY";
type Mode = "REMOTE" | "IN_PERSON" | "BOTH";
type TrustLevel = "LEVEL_0" | "LEVEL_1" | "LEVEL_2" | "LEVEL_3";

export interface Service {
  id: string;
  name: string;
  slug: string;
  cluster: Cluster;
  mode: Mode;
  descriptionReceiver: string;
  suggestedFeeMin: number;
  suggestedFeeMax: number;
  minTrustLevel: TrustLevel;
}

const CLUSTER_LABEL: Record<Cluster, string> = {
  PRESENCE: "Presence",
  NAVIGATION: "Navigation",
  CONTINUITY: "Continuity",
  CONNECTION: "Connection",
  PROFESSIONAL_ADVISORY: "Advisory",
};

const CLUSTER_COLOR: Record<Cluster, string> = {
  PRESENCE: "#4A8C6F",
  NAVIGATION: "#1A6B7A",
  CONTINUITY: "#F0B429",
  CONNECTION: "#8B7EC8",
  PROFESSIONAL_ADVISORY: "#E07B2F",
};

const CLUSTER_TAGLINE: Record<Cluster, string> = {
  PRESENCE: "For families who cannot always be there.",
  NAVIGATION:
    "For elders navigating systems that were not designed for them.",
  CONTINUITY: "For the daily things that keep life running smoothly.",
  CONNECTION: "For the moments when presence matters more than words.",
  PROFESSIONAL_ADVISORY:
    "For families who need licensed professional guidance.",
};

const CLUSTER_ORDER: Cluster[] = [
  "PRESENCE",
  "NAVIGATION",
  "CONTINUITY",
  "CONNECTION",
  "PROFESSIONAL_ADVISORY",
];

const TRUST_LABEL: Record<TrustLevel, string> = {
  LEVEL_0: "Level 0 — Remote only",
  LEVEL_1: "Level 1 — Field verified",
  LEVEL_2: "Level 2 — Home trusted",
  LEVEL_3: "Level 3 — Senior companion only",
};

const MODE_LABEL: Record<Mode, string> = {
  REMOTE: "💻 Remote",
  IN_PERSON: "📍 In-person",
  BOTH: "📍 In-person · 💻 Remote",
};

const MODE_BADGE: Record<Mode, string> = {
  REMOTE: "Remote",
  IN_PERSON: "In-person",
  BOTH: "Both",
};

const HEALTHCARE_NAMES = new Set([
  "Basic Elder Care Companion",
  "Personal Care Assistance",
  "Diaper & Continence Care",
  "Medication Management",
  "Bedridden Elder Care",
  "Day Shift Home Care",
  "Night Shift Home Care",
  "Live-in Care",
]);

function ClusterBadge({ cluster }: { cluster: Cluster }) {
  return (
    <span
      className="inline-block text-[11px] font-semibold tracking-widest uppercase px-2 py-1 rounded-full text-white"
      style={{ background: CLUSTER_COLOR[cluster] }}
    >
      {CLUSTER_LABEL[cluster]}
    </span>
  );
}

function ServiceCard({
  service,
  isOpen,
  onToggle,
}: {
  service: Service;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const tagline = CLUSTER_TAGLINE[service.cluster];

  return (
    <article
      className="rounded-2xl bg-white overflow-hidden transition-shadow"
      style={{
        border: `1px solid ${isOpen ? CLUSTER_COLOR[service.cluster] : "#E8E0D8"}`,
        boxShadow: isOpen ? "0 6px 22px rgba(28, 43, 58, 0.06)" : "none",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-5 sm:p-6 flex items-start gap-4"
        aria-expanded={isOpen}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <ClusterBadge cluster={service.cluster} />
            <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-[#F7F3EE] text-[#6B7C85]">
              {MODE_BADGE[service.mode]}
            </span>
          </div>
          <h3 className="font-[family-name:var(--font-playfair)] text-xl text-[#1C2B3A] leading-tight">
            {service.name}
          </h3>
          <p className="mt-2 text-sm text-[#1C2B3A]/70">
            From{" "}
            <span className="font-semibold text-[#1C2B3A]">
              ₹{service.suggestedFeeMin}
            </span>
          </p>
        </div>
        <span
          aria-hidden="true"
          className="shrink-0 mt-1 flex items-center justify-center rounded-full transition-transform"
          style={{
            width: 32,
            height: 32,
            border: `1.5px solid ${CLUSTER_COLOR[service.cluster]}`,
            color: CLUSTER_COLOR[service.cluster],
            transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 2v10M2 7h10"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? 800 : 0 }}
      >
        <div className="px-5 sm:px-6 pb-6 pt-2 space-y-5 text-sm leading-relaxed text-[#1C2B3A]">
          <p className="italic text-[#1C2B3A]/70">&ldquo;{tagline}&rdquo;</p>

          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-2">
              What your companion will do
            </p>
            <p>{service.descriptionReceiver}</p>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-2">
              Trust level required
            </p>
            <p className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block rounded-full"
                style={{
                  width: 10,
                  height: 10,
                  background: CLUSTER_COLOR[service.cluster],
                }}
              />
              {TRUST_LABEL[service.minTrustLevel]}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-2">
                Format
              </p>
              <p>{MODE_LABEL[service.mode]}</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-2">
                Fee range
              </p>
              <p>
                <span className="font-semibold">
                  ₹{service.suggestedFeeMin} – ₹{service.suggestedFeeMax}
                </span>{" "}
                <span className="text-[#1C2B3A]/60">per session</span>
              </p>
              <p className="text-xs text-[#1C2B3A]/60 mt-1">
                Companion receives 80%
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={`/request/new?service=${service.slug}`}
              className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
              style={{ background: "#E07B2F" }}
            >
              Book this service
            </Link>
            <Link
              href="/provider/apply"
              className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
              style={{ color: "#4A8C6F" }}
            >
              I can offer this →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ServicesClient({ services }: { services: Service[] }) {
  const [activeFilter, setActiveFilter] = useState<"ALL" | Cluster>("ALL");
  const [openId, setOpenId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const groups = new Map<Cluster, Service[]>();
    for (const s of services) {
      const list = groups.get(s.cluster) ?? [];
      list.push(s);
      groups.set(s.cluster, list);
    }
    return groups;
  }, [services]);

  const visibleClusters = useMemo(() => {
    if (activeFilter === "ALL") {
      return CLUSTER_ORDER.filter((c) => grouped.has(c));
    }
    return grouped.has(activeFilter) ? [activeFilter] : [];
  }, [activeFilter, grouped]);

  const healthcareServices = useMemo(
    () => services.filter((s) => HEALTHCARE_NAMES.has(s.name)),
    [services],
  );

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  function openGuide() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("open-neardear-guide"));
    }
  }

  if (services.length === 0) {
    return (
      <section className="bg-[#FAF5EC] py-20 px-4">
        <div className="max-w-3xl mx-auto text-center text-[#1C2B3A]/70">
          We&rsquo;re loading the service catalogue. Please refresh in a moment.
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Filter bar */}
      <section className="bg-[#FAF5EC] py-10 px-4 sticky top-0 z-10 border-b border-[#E8E0D8]">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <FilterBtn
            label="All"
            active={activeFilter === "ALL"}
            onClick={() => setActiveFilter("ALL")}
          />
          {CLUSTER_ORDER.filter((c) => grouped.has(c)).map((c) => (
            <FilterBtn
              key={c}
              label={CLUSTER_LABEL[c]}
              active={activeFilter === c}
              color={CLUSTER_COLOR[c]}
              onClick={() => setActiveFilter(c)}
            />
          ))}
        </div>
      </section>

      {/* Service grid by cluster */}
      <section className="bg-[#FAF5EC] pb-20 px-4">
        <div className="max-w-5xl mx-auto space-y-16 pt-12">
          {visibleClusters.map((cluster) => {
            const items = grouped.get(cluster) ?? [];
            return (
              <div key={cluster} id={`cluster-${cluster.toLowerCase()}`}>
                <div className="mb-8">
                  <p
                    className="text-xs font-semibold tracking-widest uppercase mb-2"
                    style={{ color: CLUSTER_COLOR[cluster] }}
                  >
                    {CLUSTER_LABEL[cluster]} services
                  </p>
                  <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl text-[#1C2B3A] leading-tight">
                    {CLUSTER_TAGLINE[cluster]}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((s) => (
                    <ServiceCard
                      key={s.id}
                      service={s}
                      isOpen={openId === s.id}
                      onToggle={() => toggle(s.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Healthcare highlight */}
      {healthcareServices.length > 0 && (
        <section className="py-20 px-4" style={{ background: "#FFF8E5" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p
                className="text-xs font-semibold tracking-widest uppercase mb-3"
                style={{ color: "#B8860B" }}
              >
                ELDER HEALTHCARE & PERSONAL CARE
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl text-[#1C2B3A] mb-5">
                Dignified, professional personal care
              </h2>
              <p className="text-[#1C2B3A]/80 max-w-2xl mx-auto leading-relaxed">
                For families managing the care of a bedridden, recovering, or
                dependent elder at home. Our companions with clinical training
                provide dignified, professional personal care.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {healthcareServices.map((s) => (
                <Link
                  key={s.id}
                  href={`/request/new?service=${s.slug}`}
                  className="rounded-xl bg-white p-5 hover:shadow-md transition-shadow"
                  style={{ border: "1px solid #F0B429" }}
                >
                  <p className="font-[family-name:var(--font-playfair)] text-base text-[#1C2B3A] leading-snug">
                    {s.name}
                  </p>
                  <p className="text-xs text-[#1C2B3A]/60 mt-2">
                    From ₹{s.suggestedFeeMin}
                  </p>
                </Link>
              ))}
            </div>
            <div className="rounded-xl p-5 bg-white/60 border border-[#F0B429]/40">
              <p className="text-sm text-[#1C2B3A]/85 leading-relaxed">
                <strong>Healthcare disclaimer:</strong> NearDear companions providing
                personal care are not registered medical professionals acting in a
                clinical capacity. They assist with care tasks as directed by the
                family and treating doctor.{" "}
                <strong>For medical emergencies: call 112.</strong>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Pricing transparency */}
      <section className="bg-[#FEF8F0] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#1A6B7A] mb-3">
              PRICING TRANSPARENCY
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl text-[#1C2B3A]">
              Simple, transparent pricing
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid #E8E0D8" }}>
              <p className="text-3xl mb-3" aria-hidden="true">💰</p>
              <h3 className="font-semibold text-[#1C2B3A] text-lg mb-2">
                No hidden fees
              </h3>
              <p className="text-sm text-[#1C2B3A]/75 leading-relaxed">
                The price you see is the price you pay. No booking fee. No platform
                subscription.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid #E8E0D8" }}>
              <p className="text-3xl mb-3" aria-hidden="true">🤝</p>
              <h3 className="font-semibold text-[#1C2B3A] text-lg mb-2">
                80% goes to your companion
              </h3>
              <p className="text-sm text-[#1C2B3A]/75 leading-relaxed">
                We retain 20% to run the platform, maintain safety systems, and
                support the community.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid #E8E0D8" }}>
              <p className="text-3xl mb-3" aria-hidden="true">💳</p>
              <h3 className="font-semibold text-[#1C2B3A] text-lg mb-2">
                Secure payment
              </h3>
              <p className="text-sm text-[#1C2B3A]/75 leading-relaxed">
                All payments via Razorpay. UPI, cards, net banking all accepted.
                Refund policy clearly stated at booking.
              </p>
            </div>
          </div>
          <div className="text-center mt-10">
            <Link
              href="/terms"
              className="text-sm font-semibold text-[#1A6B7A] hover:underline"
            >
              View refund and cancellation policy →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1C2B3A] text-white py-20 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-6">
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl mb-5">
              Need help finding the right service?
            </h2>
            <button
              type="button"
              onClick={openGuide}
              className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-[#1C2B3A] bg-white hover:bg-white/90 transition-colors"
            >
              Talk to NearDear Guide
            </button>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl mb-5">
              Ready to find a companion?
            </h2>
            <Link
              href="/request/new"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white hover:opacity-95 transition-opacity"
              style={{ background: "#E07B2F" }}
            >
              Find a NearDear
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function FilterBtn({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  const accent = color ?? "#E07B2F";
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
      style={{
        background: active ? accent : "transparent",
        color: active ? "#fff" : "#1C2B3A",
        border: `1.5px solid ${active ? accent : "#E8E0D8"}`,
      }}
    >
      {label}
    </button>
  );
}
