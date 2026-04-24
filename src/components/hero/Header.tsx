"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/language";
import NearDearLogo from "@/components/NearDearLogo";

const NAV = [
  { href: "/why-neardear", en: "Why NearDear", gu: "નિયરડિયર શા માટે" },
  { href: "/faq", en: "FAQ", gu: "FAQ" },
  { href: "/about", en: "About", gu: "વિશે" },
];

export default function Header() {
  const { data: session } = useSession();
  const { lang } = useLanguage();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E8E0D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="shrink-0" aria-label="NearDear home">
          <NearDearLogo width={140} variant="compact" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 mx-6">
          {NAV.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                style={
                  active
                    ? { color: "#E07B2F", backgroundColor: "#FFF3EC" }
                    : { color: "#6B7280" }
                }
              >
                {lang === "GU" ? link.gu : link.en}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageToggle />

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {session ? (
            <Link
              href="/dashboard"
              className="bg-[#1A6B7A] text-white rounded-full px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Dashboard →
            </Link>
          ) : (
            <Link
              href="/login"
              className="bg-[#E07B2F] text-white rounded-full px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#E8E0D8] bg-white px-4 py-3 space-y-1 shadow-md">
          {NAV.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                style={
                  active
                    ? { color: "#E07B2F", backgroundColor: "#FFF3EC" }
                    : { color: "#374151" }
                }
              >
                {lang === "GU" ? link.gu : link.en}
              </Link>
            );
          })}
          {!session && (
            <Link
              href="/provider/apply"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-medium"
              style={{ color: "#4A8C6F" }}
            >
              Join as a companion →
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
