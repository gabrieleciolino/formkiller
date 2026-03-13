"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import TestProfilesFields from "@/features/tests/components/test-profiles-fields";
import TestQuestionsFields from "@/features/tests/components/test-questions-fields";
import { createTestAction, updateTestAction } from "@/features/tests/actions";
import {
  editableTestSchema,
  TEST_ANSWERS_PER_QUESTION,
  TEST_PROFILES_COUNT,
  type EditableTestType,
} from "@/features/tests/schema";
import type { TestEditorFormProps } from "@/features/tests/types";
import { formLanguageSchema, type FormLanguage } from "@/features/forms/schema";
import { useZodLocale } from "@/hooks/use-zod-locale";
import { urls } from "@/lib/urls";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

function createEmptyEditableTest(language: FormLanguage = "it"): EditableTestType {
  return {
    name: "",
    language,
    introTitle: "",
    introMessage: "",
    endTitle: "",
    endMessage: "",
    profiles: Array.from({ length: TEST_PROFILES_COUNT }).map((_, index) => ({
      id: crypto.randomUUID(),
      order: index,
      title: "",
      description: "",
    })),
    questions: Array.from({ length: 3 }).map((_, questionIndex) => ({
      id: crypto.randomUUID(),
      order: questionIndex,
      question: "",
      answers: Array.from({ length: TEST_ANSWERS_PER_QUESTION }).map(
        (_, answerIndex) => ({
          answer: "",
          order: answerIndex,
          scores: [0, 0, 0, 0] as [number, number, number, number],
        }),
      ),
    })),
  };
}

export default function TestEditorForm({
  mode,
  initialData,
  testId,
}: TestEditorFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  useZodLocale();

  const form = useForm<EditableTestType>({
    resolver: zodResolver(editableTestSchema),
    defaultValues: initialData ?? createEmptyEditableTest(),
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [form, initialData]);

  const onSubmit = (values: EditableTestType) => {
    startTransition(async () => {
      try {
        if (mode === "create") {
          const { data, serverError, validationErrors } = await createTestAction(values);
          if (serverError || validationErrors || !data) {
            throw new Error();
          }

          toast(t("tests.editor.successCreate"));
          router.push(urls.admin.tests.detail(data.id));
          return;
        }

        if (!testId) {
          throw new Error("testId missing");
        }

        const { data, serverError, validationErrors } = await updateTestAction({
          testId,
          ...values,
        });

        if (serverError || validationErrors || !data) {
          throw new Error();
        }

        toast(t("tests.editor.successUpdate"));
        router.refresh();
      } catch {
        toast(t("tests.editor.error"));
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t("tests.editor.name")}</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="language"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>{t("tests.editor.language")}</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(formLanguageSchema.options as FormLanguage[]).map((language) => (
                    <SelectItem key={language} value={language}>
                      {t(`forms.languages.${language}` as Parameters<typeof t>[0])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Controller
          name="introTitle"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                {t("tests.editor.introTitle")}
              </FieldLabel>
              <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="endTitle"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t("tests.editor.endTitle")}</FieldLabel>
              <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="introMessage"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                {t("tests.editor.introMessage")}
              </FieldLabel>
              <Textarea
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                rows={4}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="endMessage"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t("tests.editor.endMessage")}</FieldLabel>
              <Textarea
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                rows={4}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">
          {t("tests.editor.profiles.titleSection")}
        </h3>
        <Controller
          name="profiles"
          control={form.control}
          render={({ field }) => (
            <TestProfilesFields
              values={field.value}
              onChange={field.onChange}
              disabled={isPending}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">
          {t("tests.editor.questions.titleSection")}
        </h3>
        <Controller
          name="questions"
          control={form.control}
          render={({ field }) => (
            <TestQuestionsFields
              values={field.value}
              onChange={field.onChange}
              disabled={isPending}
            />
          )}
        />
      </div>

      <Button type="submit" className="w-full md:w-auto" disabled={isPending}>
        {mode === "create"
          ? t("tests.editor.create")
          : t("tests.editor.save")}
      </Button>
    </form>
  );
}
