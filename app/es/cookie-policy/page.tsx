import LegalPage from "@/app/_components/legal-page";
import {
  getLegalContent,
  getLegalHomePath,
  getLegalMetadata,
} from "@/app/_components/legal-content";

export const metadata = getLegalMetadata("es", "cookie");

export default function CookiePolicyPageES() {
  return (
    <LegalPage
      copy={getLegalContent("es", "cookie")}
      homeHref={getLegalHomePath("es")}
    />
  );
}
