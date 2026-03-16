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
import TestEditorForm, {
  createEmptyEditableTest,
} from "@/features/tests/components/test-editor-form";
import {
  generateTestDraftAction,
  getGenerateTestDraftStatusAction,
} from "@/features/tests/actions";
import {
  generateTestDraftSchema,
  testResultTypeSchema,
  testToneSchema,
  type EditableTestType,
  type GenerateTestDraftType,
} from "@/features/tests/schema";
import { formLanguageSchema, type FormLanguage } from "@/features/forms/schema";
import { useZodLocale } from "@/hooks/use-zod-locale";
import { Sparkles, SquarePen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

export default function CreateTestForm() {
  const t = useTranslations();
  const [draft, setDraft] = useState<EditableTestType | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [isPollingDraft, setIsPollingDraft] = useState(false);
  useZodLocale();

  const form = useForm<GenerateTestDraftType>({
    resolver: zodResolver(generateTestDraftSchema),
    defaultValues: {
      additionalPrompt: "",
      questionsCount: 7,
      language: "it",
      tone: "fun",
      resultType: "profile",
    },
  });

  const handleGenerate = (values: GenerateTestDraftType) => {
    startGenerating(async () => {
      setIsPollingDraft(true);

      try {
        const {
          data: triggerData,
          serverError,
          validationErrors,
        } = await generateTestDraftAction(values);
        const runId = triggerData?.runId?.trim();

        if (serverError || validationErrors || !runId) {
          throw new Error();
        }

        const maxPollAttempts = 180;
        const pollDelayMs = 1500;
        let generatedDraft: EditableTestType | null = null;

        for (let attempt = 0; attempt < maxPollAttempts; attempt += 1) {
          const {
            data: statusData,
            serverError: statusError,
          } = await getGenerateTestDraftStatusAction({ runId });

          if (statusError || !statusData) {
            throw new Error();
          }

          if (statusData.status === "completed" && statusData.draft) {
            generatedDraft = statusData.draft;
            break;
          }

          if (statusData.status === "failed") {
            throw new Error();
          }

          await new Promise((resolve) => setTimeout(resolve, pollDelayMs));
        }

        if (!generatedDraft) {
          throw new Error();
        }

        setDraft(generatedDraft);
        toast(t("tests.create.generated"));
      } catch {
        toast(t("tests.create.generateError"));
      } finally {
        setIsPollingDraft(false);
      }
    });
  };
  const isGeneratingDraft = isGenerating || isPollingDraft;
  const selectedLanguage = form.watch("language");
  const selectedTone = form.watch("tone");
  const selectedResultType = form.watch("resultType");

  const handleStartFromScratch = () => {
    setDraft(
      createEmptyEditableTest(selectedLanguage, {
        tone: selectedTone,
        resultType: selectedResultType,
      }),
    );
  };

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-4 rounded-md border border-border p-4">
        <h3 className="text-base font-semibold text-foreground">
          {t("tests.create.generatorTitle")}
        </h3>

        <Controller
          name="additionalPrompt"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                {t("tests.create.additionalPrompt")}
              </FieldLabel>
              <Textarea
                {...field}
                id={field.name}
                rows={4}
                placeholder={t("tests.create.additionalPromptPlaceholder")}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Controller
            name="questionsCount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  {t("tests.create.questionsCount")}
                </FieldLabel>
                <Input
                  id={field.name}
                  type="number"
                  min={3}
                  max={12}
                  step={1}
                  value={field.value}
                  onChange={(event) => {
                    const value = Number.parseInt(event.target.value, 10);
                    field.onChange(Number.isNaN(value) ? 3 : value);
                  }}
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
                <FieldLabel>{t("tests.create.language")}</FieldLabel>
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
            name="tone"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>{t("tests.create.tone")}</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {testToneSchema.options.map((tone) => (
                      <SelectItem key={tone} value={tone}>
                        {t(`tests.editor.toneOptions.${tone}` as Parameters<typeof t>[0])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            name="resultType"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>{t("tests.create.resultType")}</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {testResultTypeSchema.options.map((resultType) => (
                      <SelectItem key={resultType} value={resultType}>
                        {t(
                          `tests.editor.resultTypeOptions.${resultType}` as Parameters<
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
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" variant="secondary" disabled={isGeneratingDraft}>
            <Sparkles className="size-4" />
            {isGeneratingDraft
              ? t("tests.create.generating")
              : t("tests.create.generate")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isGeneratingDraft}
            onClick={handleStartFromScratch}
          >
            <SquarePen className="size-4" />
            {t("tests.create.startFromScratch")}
          </Button>
        </div>
      </form>

      {draft ? (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground">
            {t("tests.create.reviewTitle")}
          </h3>
          <TestEditorForm mode="create" initialData={draft} />
        </div>
      ) : null}
    </div>
  );
}
