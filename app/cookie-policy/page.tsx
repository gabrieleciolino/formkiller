import LegalPage from "@/app/_components/legal-page";
import {
  getLegalContent,
  getLegalHomePath,
  getLegalMetadata,
} from "@/app/_components/legal-content";

export const metadata = getLegalMetadata("en", "cookie");

export default function CookiePolicyPage() {
  return (
    <LegalPage
      copy={getLegalContent("en", "cookie")}
      homeHref={getLegalHomePath("en")}
    />
  );
}
