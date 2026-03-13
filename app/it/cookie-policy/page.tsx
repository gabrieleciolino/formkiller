import LegalPage from "@/app/_components/legal-page";
import {
  getLegalContent,
  getLegalHomePath,
  getLegalMetadata,
} from "@/app/_components/legal-content";

export const metadata = getLegalMetadata("it", "cookie");

export default function CookiePolicyPageIT() {
  return (
    <LegalPage
      copy={getLegalContent("it", "cookie")}
      homeHref={getLegalHomePath("it")}
    />
  );
}
