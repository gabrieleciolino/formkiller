"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { useState, useTransition } from "react";
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
import EditQuestionsForm from "@/features/forms/components/edit-questions-form";

export default function CreateFormForm({
  detailPathPrefix = urls.dashboard.forms.index,
}: {
  detailPathPrefix?: string;
} = {}) {
  const [isPending, startTransition] = useTransition();
  const [manualQuestions, setManualQuestions] = useState<
    NonNullable<CreateFormType["questions"]>
  >([]);
  const router = useRouter();
  const t = useTranslations();
  useZodLocale();

  const form = useForm<CreateFormType>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      name: "",
      instructions: "",
      type: "mixed",
      language: "it",
    },
  });
  const selectedLanguage = form.watch("language") ?? "it";

  const onSubmit = (values: CreateFormType) => {
    startTransition(async () => {
      try {
        const payload: CreateFormType = {
          ...values,
          questions: manualQuestions,
        };

        const {
          data: form,
          serverError,
          validationErrors,
        } = await createFormAction(payload);

        if (serverError || validationErrors || !form) {
          throw new Error();
        }

        toast(t("forms.create.success"));
        router.push(`${detailPathPrefix.replace(/\/$/, "")}/${form.id}`);
      } catch (error) {
        console.log(error);

        toast(t("forms.create.error"));
      }
    });
  };

  return (
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
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                    {t(`forms.types.${typeKey}` as Parameters<typeof t>[0])}
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
                {(formLanguageSchema.options as FormLanguage[]).map(
                  (langKey) => (
                    <SelectItem key={langKey} value={langKey}>
                      {t(
                        `forms.languages.${langKey}` as Parameters<typeof t>[0],
                      )}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </Field>
        )}
      />
      <EditQuestionsForm
        mode="create"
        questionsData={[]}
        language={selectedLanguage}
        onQuestionsChange={setManualQuestions}
      />
      <Button
        type="submit"
        className="mt-2 w-full md:w-auto"
        disabled={isPending}
      >
        {t("forms.create.submit")}
      </Button>
    </form>
  );
}
