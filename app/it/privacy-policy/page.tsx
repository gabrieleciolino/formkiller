import LegalPage from "@/app/_components/legal-page";
import {
  getLegalContent,
  getLegalHomePath,
  getLegalMetadata,
} from "@/app/_components/legal-content";

export const metadata = getLegalMetadata("it", "privacy");

export default function PrivacyPolicyPageIT() {
  return (
    <LegalPage
      copy={getLegalContent("it", "privacy")}
      homeHref={getLegalHomePath("it")}
    />
  );
}
