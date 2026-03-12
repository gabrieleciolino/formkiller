"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  createFormSchema,
  CreateFormType,
  FormLanguage,
  formLanguageSchema,
  FormType,
  formTypeSchema,
} from "@/features/forms/schema";
import { createFormAction } from "@/features/forms/actions";
import { useZodLocale } from "@/hooks/use-zod-locale";
import { useRouter } from "next/navigation";
import { urls } from "@/lib/urls";
import { useTranslations } from "next-intl";

export default function CreateFormSheet() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations();
  useZodLocale();

  const form = useForm<CreateFormType>({
    resolver: zodResolver(createFormSchema),
    values: {
      name: "",
      instructions: "",
      type: "mixed",
      language: "it",
    },
  });

  const onSubmit = (values: CreateFormType) => {
    startTransition(async () => {
      try {
        const {
          data: form,
          serverError,
          validationErrors,
        } = await createFormAction(values);

        if (serverError || validationErrors || !form) {
          throw new Error();
        }

        toast(t("forms.create.success"));
        router.push(urls.dashboard.forms.detail(form.id));
      } catch (error) {
        console.log(error);

        toast(t("forms.create.error"));
      }
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="lg">{t("forms.create.trigger")}</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="text-xl font-black">
            {t("forms.create.title")}
          </SheetTitle>
        </SheetHeader>
        <div className="m-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t("forms.create.name")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t("forms.create.namePlaceholder")}
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="instructions"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t("forms.create.instructions")}
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t("forms.create.instructionsPlaceholder")}
                    autoComplete="off"
                    className="min-h-[150px]"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="type"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>{t("forms.create.type")}</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(formTypeSchema.options as FormType[]).map((typeKey) => (
                        <SelectItem key={typeKey} value={typeKey}>
                          {t(
                            `forms.types.${typeKey}` as Parameters<typeof t>[0],
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Controller
              name="language"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>{t("forms.create.language")}</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(formLanguageSchema.options as FormLanguage[]).map((langKey) => (
                        <SelectItem key={langKey} value={langKey}>
                          {t(
                            `forms.languages.${langKey}` as Parameters<
                              typeof t
                            >[0],
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Button type="submit" className="mt-2 w-full">
              {t("forms.create.submit")}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
