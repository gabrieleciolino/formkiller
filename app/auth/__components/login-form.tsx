"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { toast } from "sonner";
import { loginFormSchema, LoginFormType } from "@/app/auth/__components/schema";
import { loginAction } from "@/app/auth/__components/actions";
import { useRouter, useSearchParams } from "next/navigation";
import { urls } from "@/lib/urls";

export default function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect_to");

  console.log(searchParams);

  const form = useForm<LoginFormType>({
    resolver: zodResolver(loginFormSchema),
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
        toast("Logged in.");
      } catch (error) {
        console.log(error);

        toast("Login failed.");
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
            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="Email"
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
            <FieldLabel htmlFor={field.name}>Password</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="Password"
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Button type="submit" className="mt-2 w-full">
        Login
      </Button>
    </form>
  );
}
