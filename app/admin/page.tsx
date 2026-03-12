import { urls } from "@/lib/urls";
import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect(urls.admin.forms.index);
}
