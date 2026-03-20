import RegisterForm from "@/app/auth/__components/register-form";
import AuthWrapper from "@/app/auth/__components/wrapper";
import { getTranslations } from "next-intl/server";

export default async function RegisterPage() {
  const t = await getTranslations();

  return (
    <AuthWrapper
      title={t("auth.register.title")}
      description={t("auth.register.description")}
    >
      <RegisterForm />
    </AuthWrapper>
  );
}
