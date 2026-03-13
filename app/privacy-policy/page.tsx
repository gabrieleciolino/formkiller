import LegalPage from "@/app/_components/legal-page";
import {
  getLegalContent,
  getLegalHomePath,
  getLegalMetadata,
} from "@/app/_components/legal-content";

export const metadata = getLegalMetadata("en", "privacy");

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      copy={getLegalContent("en", "privacy")}
      homeHref={getLegalHomePath("en")}
    />
  );
}
