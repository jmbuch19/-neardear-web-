import type { Metadata } from "next";
import PolicyLayout, { PolicyList, PolicySection } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Abuse Policy — NearDear",
  description:
    "NearDear has zero tolerance for abuse. How we prevent it, how to report it, and how we protect everyone on the platform.",
};

export default function AbusePolicyPage() {
  return (
    <PolicyLayout
      title="Abuse Policy"
      lastUpdated="April 2026"
      currentHref="/abuse-policy"
    >
      <p className="text-lg mb-10">
        NearDear has zero tolerance for abuse of any kind on this platform.
      </p>

      <PolicySection title="Prohibited conduct — companions">
        <PolicyList
          items={[
            "Requesting cash from service receivers",
            "Accepting gifts",
            "Sharing personal contact details outside the platform",
            "Any financial solicitation",
            "Any form of physical, emotional, or financial abuse",
            "Any conduct violating the Code of Conduct",
          ]}
        />
      </PolicySection>

      <PolicySection title="Prohibited conduct — receivers">
        <PolicyList
          items={[
            "False claims or disputes",
            "Abusive behaviour toward companions",
            "Attempting to contact companions outside the platform",
            "Any form of harassment",
          ]}
        />
      </PolicySection>

      <PolicySection title="Reporting abuse">
        <PolicyList
          items={[
            "Flag any concern directly in the app",
            <>
              Email{" "}
              <a
                href="mailto:abuse@neardear.in"
                className="font-semibold text-[#1A6B7A] hover:underline"
              >
                abuse@neardear.in
              </a>
            </>,
            "All reports reviewed within 24 hours",
            "HIGH severity: reviewed within 4 hours",
          ]}
        />
      </PolicySection>

      <PolicySection title="Consequences">
        <PolicyList
          items={[
            "Warning issued",
            "Account suspension",
            "Permanent removal",
            "Legal action where warranted",
          ]}
        />
      </PolicySection>

      <PolicySection title="Protecting companions">
        <p>
          Companions are also protected. False claims by receivers are taken seriously and
          investigated equally — the same review process applies in both directions.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
