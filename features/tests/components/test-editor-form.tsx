"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
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
import {
  createTestAction,
  getTestVoicesAction,
  updateTestAction,
} from "@/features/tests/actions";
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
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type VoiceOption = {
  id: string;
  name: string;
  category: string | null;
  previewUrl: string | null;
};

export function createEmptyEditableTest(
  language: FormLanguage = "it",
): EditableTestType {
  return {
    name: "",
    language,
    voiceId: undefined,
    isPublished: false,
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
  const [voiceOptions, setVoiceOptions] = useState<VoiceOption[]>([]);
  const [isVoicesPending, setIsVoicesPending] = useState(true);
  const [isVoicesError, setIsVoicesError] = useState(false);
  useZodLocale();

  const form = useForm<EditableTestType>({
    resolver: zodResolver(editableTestSchema),
    defaultValues: initialData ?? createEmptyEditableTest(),
  });
  const selectedVoiceId = form.watch("voiceId");
  const selectedVoice = voiceOptions.find((voice) => voice.id === selectedVoiceId);

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [form, initialData]);

  useEffect(() => {
    let isActive = true;

    const loadVoices = async () => {
      setIsVoicesPending(true);
      setIsVoicesError(false);

      try {
        const {
          data,
          serverError,
          validationErrors,
        } = await getTestVoicesAction({});

        if (serverError || validationErrors || !data) {
          throw new Error("Unable to load ElevenLabs voices.");
        }

        const nextVoiceOptions = [...data.voices];
        const defaultVoiceId = data.defaultVoiceId?.trim() || undefined;

        if (
          defaultVoiceId &&
          !nextVoiceOptions.some((voice) => voice.id === defaultVoiceId)
        ) {
          nextVoiceOptions.unshift({
            id: defaultVoiceId,
            name: t("tests.editor.defaultVoiceName"),
            category: null,
            previewUrl: null,
          });
        }

        if (!isActive) {
          return;
        }

        setVoiceOptions(nextVoiceOptions);

        const currentVoiceId = form.getValues("voiceId");
        if (!currentVoiceId) {
          const voiceToSelect = defaultVoiceId ?? nextVoiceOptions[0]?.id;
          if (voiceToSelect) {
            form.setValue("voiceId", voiceToSelect, {
              shouldValidate: true,
            });
          }
        }
      } catch {
        if (!isActive) {
          return;
        }

        setIsVoicesError(true);
      } finally {
        if (isActive) {
          setIsVoicesPending(false);
        }
      }
    };

    loadVoices();

    return () => {
      isActive = false;
    };
  }, [form, t]);

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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        <Controller
          name="voiceId"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>{t("tests.editor.voice")}</FieldLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isVoicesPending || voiceOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isVoicesPending
                        ? t("tests.editor.voiceLoading")
                        : voiceOptions.length === 0
                          ? t("tests.editor.voiceUnavailable")
                          : t("tests.editor.voicePlaceholder")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {voiceOptions.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isVoicesError ? (
                <FieldDescription className="text-destructive">
                  {t("tests.editor.voiceLoadError")}
                </FieldDescription>
              ) : (
                <FieldDescription>{t("tests.editor.voiceHint")}</FieldDescription>
              )}
            </Field>
          )}
        />

        <Controller
          name="isPublished"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>{t("tests.editor.publish")}</FieldLabel>
              <Select
                value={field.value ? "published" : "draft"}
                onValueChange={(value) => field.onChange(value === "published")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">
                    {t("tests.editor.publishOptions.draft")}
                  </SelectItem>
                  <SelectItem value="published">
                    {t("tests.editor.publishOptions.published")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      </div>

      {selectedVoice && (
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-sm font-medium text-foreground">
            {selectedVoice.name}
          </p>
          {selectedVoice.category && (
            <p className="text-xs text-muted-foreground">
              {selectedVoice.category}
            </p>
          )}
          {selectedVoice.previewUrl && (
            <audio
              className="mt-2 w-full"
              controls
              preload="none"
              src={selectedVoice.previewUrl}
            />
          )}
        </div>
      )}

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
