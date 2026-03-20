"use client";

import { registerAction } from "@/app/auth/__components/actions";
import { registerFormSchema, type RegisterFormType } from "@/app/auth/__components/schema";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useZodLocale } from "@/hooks/use-zod-locale";
import { urls } from "@/lib/urls";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export default function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations();
  useZodLocale();

  const form = useForm<RegisterFormType>({
    resolver: zodResolver(registerFormSchema),
    values: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: RegisterFormType) => {
    startTransition(async () => {
      try {
        const { data, serverError, validationErrors } = await registerAction(values);

        if (serverError || validationErrors || !data) {
          throw new Error();
        }

        toast(t("auth.register.success"));
        router.push(urls.dashboard.index);
      } catch {
        toast(t("auth.register.error"));
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
            <FieldLabel htmlFor={field.name}>{t("auth.register.email")}</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="email"
              aria-invalid={fieldState.invalid}
              placeholder={t("auth.register.email")}
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
            <FieldLabel htmlFor={field.name}>
              {t("auth.register.password")}
            </FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="password"
              aria-invalid={fieldState.invalid}
              placeholder={t("auth.register.password")}
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Button type="submit" className="mt-2 w-full" disabled={isPending}>
        {t("auth.register.submit")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        <Link href={urls.auth.login} className="underline underline-offset-2">
          {t("auth.register.loginCta")}
        </Link>
      </p>
    </form>
  );
}
