import Link from "next/link";
import Header from "@/components/hero/Header";
import Footer from "@/components/hero/Footer";

const POLICIES = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/abuse-policy", label: "Abuse Policy" },
  { href: "/grievance", label: "Grievance Policy" },
];

export default function PolicyLayout({
  title,
  lastUpdated,
  currentHref,
  children,
}: {
  title: string;
  lastUpdated: string;
  currentHref: string;
  children: React.ReactNode;
}) {
  const related = POLICIES.filter((p) => p.href !== currentHref);
  return (
    <>
      <Header />
      <main className="bg-[#FEF8F0] min-h-screen py-12 sm:py-16 px-4">
        <div className="max-w-[720px] mx-auto">
          <Link
            href="/"
            className="text-sm font-semibold text-[#1A6B7A] hover:underline inline-flex items-center gap-1"
          >
            <span aria-hidden="true">←</span> Back to home
          </Link>
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl text-[#1C2B3A] mt-6 mb-12 leading-tight">
            {title}
          </h1>
          <article className="text-[#1C2B3A]">{children}</article>
          <p className="text-sm text-[#6B7C85] mt-16 pt-8 border-t border-[#E8E0D8]">
            Last updated: {lastUpdated}
          </p>
          <nav className="mt-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#1A6B7A] mb-4">
              Related Policies
            </h2>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {related.map((p) => (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    className="text-sm font-medium text-[#1A6B7A] hover:underline"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl text-[#1A6B7A] mb-4">
        {title}
      </h2>
      <div className="space-y-4 leading-relaxed text-[#1C2B3A]">{children}</div>
    </section>
  );
}

export function PolicyList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2 list-disc pl-6 marker:text-[#1A6B7A]">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
