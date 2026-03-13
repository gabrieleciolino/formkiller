import LegalPage from "@/app/_components/legal-page";
import {
  getLegalContent,
  getLegalHomePath,
  getLegalMetadata,
} from "@/app/_components/legal-content";

export const metadata = getLegalMetadata("es", "privacy");

export default function PrivacyPolicyPageES() {
  return (
    <LegalPage
      copy={getLegalContent("es", "privacy")}
      homeHref={getLegalHomePath("es")}
    />
  );
}
