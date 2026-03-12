import { urls } from "@/lib/urls";
import { redirect } from "next/navigation";

export default function LibraryPage() {
  redirect(urls.dashboard.forms.index);
}
