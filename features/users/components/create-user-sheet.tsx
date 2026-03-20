"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createUserAction } from "@/features/users/actions";
import {
  accountTierSchema,
  accountRoleSchema,
  type AccountTier,
  createUserSchema,
  type AccountRole,
} from "@/features/users/schema";
import type { CreateUserFormValues } from "@/features/users/types";
import { useZodLocale } from "@/hooks/use-zod-locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

export default function CreateUserSheet() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations();
  useZodLocale();

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: "user",
      tier: "free",
    },
  });

  const onSubmit = (values: CreateUserFormValues) => {
    startTransition(async () => {
      try {
        const { data, serverError, validationErrors } =
          await createUserAction(values);

        if (serverError || validationErrors || !data) {
          throw new Error();
        }

        toast(t("dashboard.users.create.success"));
        form.reset({
          username: "",
          email: "",
          password: "",
          role: "user",
          tier: "free",
        });
        setOpen(false);
        router.refresh();
      } catch {
        toast(t("dashboard.users.create.error"));
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <PlusIcon className="size-4" />
          {t("dashboard.users.create.trigger")}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("dashboard.users.create.title")}</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-6 space-y-4 px-4"
        >
          <Controller
            name="username"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  {t("dashboard.users.create.username")}
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="text"
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  placeholder={t("dashboard.users.create.usernamePlaceholder")}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  {t("dashboard.users.create.email")}
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  placeholder={t("dashboard.users.create.emailPlaceholder")}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  {t("dashboard.users.create.password")}
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="password"
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  placeholder="***"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="role"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>{t("dashboard.users.create.role")}</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(value as AccountRole)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(accountRoleSchema.options as AccountRole[]).map(
                      (role) => (
                        <SelectItem key={role} value={role}>
                          {t(
                            `dashboard.users.roles.${role}` as Parameters<
                              typeof t
                            >[0],
                          )}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="tier"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>{t("dashboard.users.create.tier")}</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(value as AccountTier)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(accountTierSchema.options as AccountTier[]).map((tier) => (
                      <SelectItem key={tier} value={tier}>
                        {t(
                          `dashboard.users.tiers.${tier}` as Parameters<
                            typeof t
                          >[0],
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {t("dashboard.users.create.submit")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
