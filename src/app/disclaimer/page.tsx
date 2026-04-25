import type { Metadata } from "next";
import PolicyLayout, { PolicyList, PolicySection } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Platform Disclaimer — NearDear",
  description:
    "How NearDear connects families with verified companions and what we are not responsible for.",
};

export default function DisclaimerPage() {
  return (
    <PolicyLayout
      title="Platform Disclaimer"
      lastUpdated="April 2026"
      currentHref="/disclaimer"
    >
      <p className="text-lg mb-10">
        NearDear.in is a platform that connects families and individuals with verified
        companions and professional advisors.
      </p>

      <PolicySection title="What NearDear is">
        <p>
          A matching, booking, payment, and accountability platform. We verify companions,
          track sessions, collect feedback, and hold everyone accountable.
        </p>
      </PolicySection>

      <PolicySection title="What NearDear is not">
        <PolicyList
          items={[
            "A medical service or provider",
            "A legal services firm",
            "A financial advisory service",
            "An employer of companions (all companions are independent)",
            "An emergency response service",
            "A replacement for professional medical, legal, or financial advice",
          ]}
        />
      </PolicySection>

      <PolicySection title="Companion independence">
        <p>
          All NearDear companions are independent individuals, not employees or agents of
          NearDear.in. NearDear is not responsible for the quality, accuracy, or outcomes
          of any session or advice provided by companions or advisors.
        </p>
      </PolicySection>

      <PolicySection title="Medical disclaimer">
        <p>
          Nothing on this platform constitutes medical advice or treatment. Companions
          providing personal care assistance do so as directed by families — not as
          medical professionals.
        </p>
        <p>
          <strong>For medical emergencies, call 112.</strong>
        </p>
      </PolicySection>

      <PolicySection title="Limitation of liability">
        <p>
          NearDear.in provides a platform service only. To the maximum extent permitted by
          law, NearDear is not liable for any direct, indirect, or consequential damages
          arising from the use of this platform or the services provided by companions.
        </p>
      </PolicySection>

      <PolicySection title="Governing law">
        <p>
          These terms are governed by the laws of India. Any disputes are subject to the
          jurisdiction of courts in Ahmedabad, Gujarat.
        </p>
      </PolicySection>

      <PolicySection title="Contact">
        <p>
          Legal queries:{" "}
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
