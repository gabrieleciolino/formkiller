import LoginForm from "@/app/auth/__components/login-form";
import AuthWrapper from "@/app/auth/__components/wrapper";
import { getTranslations } from "next-intl/server";

export default async function LoginPage() {
  const t = await getTranslations();

  return (
    <AuthWrapper
      title={t("auth.login.title")}
      description={t("auth.login.description")}
    >
      <LoginForm />
    </AuthWrapper>
  );
}
