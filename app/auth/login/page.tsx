import LoginForm from "@/app/auth/__components/login-form";
import AuthWrapper from "@/app/auth/__components/wrapper";

export default function LoginPage() {
  return (
    <AuthWrapper title="Login">
      <LoginForm />
    </AuthWrapper>
  );
}
