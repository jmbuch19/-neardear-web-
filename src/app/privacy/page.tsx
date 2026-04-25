import type { Metadata } from "next";
import PolicyLayout, { PolicyList, PolicySection } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — NearDear",
  description:
    "What data NearDear collects, how we use it, and what we never do with it.",
};

export default function PrivacyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      lastUpdated="April 2026"
      currentHref="/privacy"
    >
      <p className="text-lg mb-10">
        Your privacy matters. This page explains the data we collect, why, and the rights
        you have over it.
      </p>

      <PolicySection title="1. What data we collect">
        <PolicyList
          items={[
            "Name, phone, email, city",
            "Elder profile details (when provided by families)",
            "Session records (timing, location, notes)",
            "Payment information (processed via secure providers)",
            "GPS check-in/out for companions during sessions",
            "Device and usage data (for security and reliability)",
          ]}
        />
      </PolicySection>

      <PolicySection title="2. How we use your data">
        <PolicyList
          items={[
            "Matching companions to family requests",
            "Processing payments and payouts",
            "Sending session notifications and reminders",
            "Improving the platform",
            "Safety, accountability, and dispute resolution",
          ]}
        />
      </PolicySection>

      <PolicySection title="3. What we never do">
        <PolicyList
          items={[
            "Never sell your data",
            "Never share with advertisers",
            "Never expose individual session data to institutions",
          ]}
        />
      </PolicySection>

      <PolicySection title="4. Aadhaar data">
        <PolicyList
          items={[
            "Only the last 4 digits are stored",
            "The full number is never retained",
            "Verified via the official government API",
          ]}
        />
      </PolicySection>

      <PolicySection title="5. Data retention">
        <PolicyList
          items={[
            "Active accounts: data retained while in use",
            "Closed accounts: anonymised within 30 days",
            "Financial records: 7 years (legal requirement)",
            "Safety records: retained permanently for accountability",
          ]}
        />
      </PolicySection>

      <PolicySection title="6. Your rights">
        <PolicyList
          items={[
            "Access the data we hold about you",
            "Correct inaccurate or incomplete data",
            "Request deletion (with limits where law requires retention)",
            "Download a portable copy of your data",
          ]}
        />
      </PolicySection>

      <PolicySection title="7. Cookies">
        <PolicyList
          items={[
            "Session cookies only — for keeping you signed in",
            "No advertising cookies",
            "No third-party tracking",
          ]}
        />
      </PolicySection>

      <PolicySection title="8. Contact">
        <p>
          Privacy queries:{" "}
          <a
            href="mailto:privacy@neardear.in"
            className="font-semibold text-[#1A6B7A] hover:underline"
          >
            privacy@neardear.in
          </a>
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
