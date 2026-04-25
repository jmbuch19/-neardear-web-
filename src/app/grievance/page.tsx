import type { Metadata } from "next";
import PolicyLayout, { PolicyList, PolicySection } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Grievance Redressal Policy — NearDear",
  description:
    "How to raise a grievance with NearDear, including officer details and timelines under Indian IT Rules 2021.",
};

export default function GrievancePage() {
  return (
    <PolicyLayout
      title="Grievance Redressal Policy"
      lastUpdated="April 2026"
      currentHref="/grievance"
    >
      <p className="text-lg mb-10">
        Published as required under the Indian IT Rules, 2021.
      </p>

      <PolicySection title="Grievance Officer">
        <PolicyList
          items={[
            <>
              <strong>Name:</strong> Jaydeep Buch
            </>,
            <>
              <strong>Email:</strong>{" "}
              <a
                href="mailto:grievance@neardear.in"
                className="font-semibold text-[#1A6B7A] hover:underline"
              >
                grievance@neardear.in
              </a>
            </>,
            <>
              <strong>Address:</strong> Ahmedabad, Gujarat, India
            </>,
          ]}
        />
      </PolicySection>

      <PolicySection title="How to raise a grievance">
        <p>
          Email{" "}
          <a
            href="mailto:grievance@neardear.in"
            className="font-semibold text-[#1A6B7A] hover:underline"
          >
            grievance@neardear.in
          </a>{" "}
          and include:
        </p>
        <PolicyList
          items={[
            "Your name and the phone number on your account",
            "A clear description of the issue",
            "The relevant session ID, if applicable",
            "Any supporting screenshots or context",
          ]}
        />
      </PolicySection>

      <PolicySection title="Timeline">
        <PolicyList
          items={[
            "Acknowledgement: within 24 hours",
            "Resolution: within 30 days",
          ]}
        />
      </PolicySection>

      <PolicySection title="Escalation">
        <p>
          If your grievance is not resolved within 30 days, you may approach the relevant
          regulatory authority for further redress.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
