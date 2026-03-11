"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { toast } from "sonner";
import { makeLoginFormSchema, LoginFormType } from "@/app/auth/__components/schema";
import { loginAction } from "@/app/auth/__components/actions";
import { useRouter, useSearchParams } from "next/navigation";
import { urls } from "@/lib/urls";
import { useTranslations } from "next-intl";

export default function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth.login");
  const tv = useTranslations("validation");

  const redirectTo = searchParams.get("redirect_to");

  const form = useForm<LoginFormType>({
    resolver: zodResolver(makeLoginFormSchema({ required: tv("required"), emailInvalid: tv("emailInvalid") })),
    values: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: LoginFormType) => {
    startTransition(async () => {
      try {
        const { serverError, validationErrors } = await loginAction(values);

        if (serverError || validationErrors) {
          throw new Error();
        }

        router.push(redirectTo ? redirectTo : urls.dashboard.index);
        toast(t("success"));
      } catch (error) {
        console.log(error);

        toast(t("error"));
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{t("email")}</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder={t("email")}
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="password"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{t("password")}</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder={t("password")}
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Button type="submit" className="mt-2 w-full">
        {t("submit")}
      </Button>
    </form>
  );
}
