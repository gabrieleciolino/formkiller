import { urls } from "@/lib/urls";
import { redirect } from "next/navigation";

export default function CreateFormPage() {
  redirect(urls.dashboard.forms.index);
}
