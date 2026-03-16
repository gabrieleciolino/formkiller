"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
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
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createFormSchema,
  CreateFormType,
  FormLanguage,
  formLanguageSchema,
  FormType,
  formTypeSchema,
} from "@/features/forms/schema";
import {
  createFormAction,
  getCreateFormStatusAction,
  getElevenLabsVoicesAction,
} from "@/features/forms/actions";
import { useZodLocale } from "@/hooks/use-zod-locale";
import { useRouter } from "next/navigation";
import { urls } from "@/lib/urls";
import { useTranslations } from "next-intl";
import EditQuestionsForm from "@/features/forms/components/edit-questions-form";

type VoiceOption = {
  id: string;
  name: string;
  category: string | null;
  previewUrl: string | null;
};

export default function CreateFormForm({
  detailPathPrefix = urls.dashboard.forms.index,
}: {
  detailPathPrefix?: string;
} = {}) {
  const [isPending, startTransition] = useTransition();
  const [isCreatingAsync, setIsCreatingAsync] = useState(false);
  const [manualQuestions, setManualQuestions] = useState<
    NonNullable<CreateFormType["questions"]>
  >([]);
  const [voiceOptions, setVoiceOptions] = useState<VoiceOption[]>([]);
  const [isVoicesPending, setIsVoicesPending] = useState(true);
  const [isVoicesError, setIsVoicesError] = useState(false);
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
      voiceId: undefined,
      questions: [],
    },
  });
  const selectedLanguage = form.watch("language") ?? "it";
  const selectedVoiceId = form.watch("voiceId");
  const selectedVoice = voiceOptions.find((voice) => voice.id === selectedVoiceId);
  const isSubmitting = isPending || isCreatingAsync;

  useEffect(() => {
    form.setValue("questions", manualQuestions, {
      shouldValidate: true,
    });
  }, [form, manualQuestions]);

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
        } = await getElevenLabsVoicesAction({});

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
            name: t("forms.create.defaultVoiceName"),
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

  const onSubmit = (values: CreateFormType) => {
    startTransition(async () => {
      setIsCreatingAsync(true);

      try {
        const payload: CreateFormType = {
          ...values,
          questions: manualQuestions,
        };

        const {
          data: triggerData,
          serverError,
          validationErrors,
        } = await createFormAction(payload);

        const runId = triggerData?.runId?.trim();

        if (serverError || validationErrors || !runId) {
          throw new Error();
        }

        const maxPollAttempts = 240;
        const pollDelayMs = 1500;
        let createdFormId: string | null = null;

        for (let attempt = 0; attempt < maxPollAttempts; attempt += 1) {
          const {
            data: statusData,
            serverError: statusError,
          } = await getCreateFormStatusAction({ runId });

          if (statusError || !statusData) {
            throw new Error();
          }

          if (statusData.status === "completed" && statusData.formId) {
            createdFormId = statusData.formId;
            break;
          }

          if (statusData.status === "failed") {
            throw new Error();
          }

          await new Promise((resolve) => setTimeout(resolve, pollDelayMs));
        }

        if (!createdFormId) {
          throw new Error();
        }

        toast(t("forms.create.success"));
        router.push(
          `${detailPathPrefix.replace(/\/$/, "")}/${createdFormId}`,
        );
      } catch (error) {
        console.log(error);

        toast(t("forms.create.error"));
      } finally {
        setIsCreatingAsync(false);
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
      <Controller
        name="voiceId"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("forms.create.voice")}</FieldLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={isVoicesPending || voiceOptions.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    isVoicesPending
                      ? t("forms.create.voiceLoading")
                      : voiceOptions.length === 0
                        ? t("forms.create.voiceUnavailable")
                        : t("forms.create.voicePlaceholder")
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

            {isVoicesError ? (
              <FieldDescription className="text-destructive">
                {t("forms.create.voiceLoadError")}
              </FieldDescription>
            ) : (
              <FieldDescription>{t("forms.create.voiceHint")}</FieldDescription>
            )}
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
        disabled={isSubmitting}
      >
        {isSubmitting ? t("forms.create.creating") : t("forms.create.submit")}
      </Button>
    </form>
  );
}
