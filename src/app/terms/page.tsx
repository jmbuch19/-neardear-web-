import type { Metadata } from "next";
import Link from "next/link";
import PolicyLayout, { PolicyList, PolicySection } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Terms of Service — NearDear",
  description:
    "Plain-language terms of service for NearDear families, companions, and the platform.",
};

export default function TermsPage() {
  return (
    <PolicyLayout
      title="Terms of Service"
      lastUpdated="April 2026"
      currentHref="/terms"
    >
      <p className="text-lg mb-10">
        Plain language. No legal jargon. By using NearDear, you agree to the terms below.
      </p>

      <PolicySection title="1. Acceptance of terms">
        <p>
          When you create an account or use NearDear in any way, you accept these terms.
          If you do not agree, please do not use the platform.
        </p>
      </PolicySection>

      <PolicySection title="2. The platform — what NearDear does">
        <p>
          NearDear is a matching, booking, payment, and accountability platform that
          connects families with verified companions. We are not the companions; we are
          the infrastructure that helps families find them and trust them.
        </p>
      </PolicySection>

      <PolicySection title="3. User accounts and registration">
        <PolicyList
          items={[
            "You must be 18 or older to register an account",
            "You must provide accurate information",
            "You are responsible for activity on your account",
            "We may suspend accounts that violate these terms",
          ]}
        />
      </PolicySection>

      <PolicySection title="4. Service receiver terms">
        <p>
          Service receivers (families and individuals booking companions) agree to:
        </p>
        <PolicyList
          items={[
            "Provide truthful information about the elder or person needing care",
            "Pay for sessions through the platform — never directly to companions",
            "Treat companions with respect",
            "Use the in-app flagging system for any concerns",
          ]}
        />
      </PolicySection>

      <PolicySection title="5. Companion terms">
        <p>Companions are independent individuals who agree to:</p>
        <PolicyList
          items={[
            "Complete identity verification (Aadhaar) and police clearance",
            "Follow the NearDear Code of Conduct on every session",
            "Check in and check out with GPS for every session",
            "Never request cash, gifts, or off-platform contact",
            "Submit session notes after each visit",
          ]}
        />
      </PolicySection>

      <PolicySection title="6. Payments and refunds">
        <p>
          Payments are processed securely via Razorpay. NearDear retains a platform fee;
          the rest is paid to the companion as earnings.
        </p>
        <PolicyList
          items={[
            "Sessions are paid for in advance through the platform",
            "Companion earnings are released after session completion",
            "Refunds follow the cancellation policy below",
            "Disputed sessions are reviewed by the NearDear team",
          ]}
        />
      </PolicySection>

      <PolicySection title="7. Cancellation policy">
        <PolicyList
          items={[
            "Cancellations more than 24 hours before the session: full refund",
            "Cancellations within 24 hours: partial refund",
            "Cancellations within 2 hours: no refund (companion is on the way)",
            "No-shows by companions: full refund + companion penalty",
          ]}
        />
      </PolicySection>

      <PolicySection title="8. Prohibited conduct">
        <p>
          NearDear has zero tolerance for abuse, harassment, or off-platform solicitation.
          See our{" "}
          <Link href="/abuse-policy" className="font-semibold text-[#1A6B7A] hover:underline">
            Abuse Policy
          </Link>{" "}
          for the full list and consequences.
        </p>
      </PolicySection>

      <PolicySection title="9. Privacy and data">
        <p>
          We collect and use your data as described in our{" "}
          <Link href="/privacy" className="font-semibold text-[#1A6B7A] hover:underline">
            Privacy Policy
          </Link>
          . We never sell your data.
        </p>
      </PolicySection>

      <PolicySection title="10. Intellectual property">
        <p>
          All NearDear branding, content, and software is owned by NearDear.in. Companion
          notes and feedback you submit may be used to improve the platform and remain
          confidential to NearDear and the relevant family.
        </p>
      </PolicySection>

      <PolicySection title="11. Dispute resolution">
        <p>
          Most issues are resolved through the in-app flagging system or by emailing{" "}
          <a
            href="mailto:grievance@neardear.in"
            className="font-semibold text-[#1A6B7A] hover:underline"
          >
            grievance@neardear.in
          </a>
          . Unresolved disputes are subject to the jurisdiction of courts in Ahmedabad,
          Gujarat, under Indian law.
        </p>
      </PolicySection>

      <PolicySection title="12. Modifications to terms">
        <p>
          We may update these terms over time. Material changes will be communicated by
          email or in-app notice. Continued use of the platform means you accept the
          updated terms.
        </p>
      </PolicySection>

      <PolicySection title="13. Contact">
        <p>
          Questions about these terms:{" "}
          <a
            href="mailto:legal@neardear.in"
            className="font-semibold text-[#1A6B7A] hover:underline"
          >
            legal@neardear.in
          </a>
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
