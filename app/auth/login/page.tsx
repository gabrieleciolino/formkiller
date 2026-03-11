import LoginForm from "@/app/auth/__components/login-form";
import AuthWrapper from "@/app/auth/__components/wrapper";
import { getTranslations } from "next-intl/server";

export default async function LoginPage() {
  const t = await getTranslations("auth.login");

  return (
    <AuthWrapper title={t("title")}>
      <LoginForm />
    </AuthWrapper>
  );
}
