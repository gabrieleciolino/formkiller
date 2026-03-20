"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  editQuestionsAction,
  getElevenLabsVoicesAction,
  regenerateFormQuestionsTTSAction,
} from "@/features/forms/actions";
import {
  FORM_VOICE_SPEED_DEFAULT,
  editQuestionsSchema,
  EditQuestionsType,
} from "@/features/forms/schema";
import type { EditQuestionsFormProps } from "@/features/forms/types";
import { useZodLocale } from "@/hooks/use-zod-locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Trash2, WandSparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import AddQuestionSheet from "@/features/forms/components/edit-questions-form/add-question-sheet";
import DefaultAnswersFields from "@/features/forms/components/edit-questions-form/default-answers-fields";
import DeleteQuestionButton from "@/features/forms/components/edit-questions-form/delete-question-button";
import QuestionTTSControls from "@/features/forms/components/edit-questions-form/question-tts-controls";

export default function EditQuestionsForm({
  questionsData,
  formId,
  language,
  voiceId = null,
  voiceSpeed = FORM_VOICE_SPEED_DEFAULT,
  initialFileUrls = {},
  mode = "edit",
  onQuestionsChange,
  readOnly = false,
  allowVoiceControls = true,
}: EditQuestionsFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRegeneratingAll, startRegeneratingAll] = useTransition();
  const [voiceNameById, setVoiceNameById] = useState<Record<string, string>>({});
  useZodLocale();
  const isCreateMode = mode === "create";
  const resolvedFormId =
    formId ?? "00000000-0000-0000-0000-000000000000";
  const normalizedVoiceSpeed =
    typeof voiceSpeed === "number" && Number.isFinite(voiceSpeed)
      ? voiceSpeed
      : FORM_VOICE_SPEED_DEFAULT;
  const normalizedVoiceId = voiceId?.trim() || null;
  const voiceLabel = normalizedVoiceId
    ? voiceNameById[normalizedVoiceId] ?? normalizedVoiceId
    : t("forms.questions.voiceDefaultName");
  const hasGeneratedTts = Object.values(initialFileUrls).some((url) => Boolean(url));

  if (!isCreateMode && !formId) {
    throw new Error("formId is required in edit mode");
  }

  const form = useForm<EditQuestionsType>({
    resolver: zodResolver(editQuestionsSchema),
    defaultValues: { questions: questionsData, formId: resolvedFormId, language },
  });

  const { fields: questionFields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
    keyName: "rhfKey",
  });
  const watchedQuestions = useWatch({
    control: form.control,
    name: "questions",
  });
  const lastSyncedQuestionsRef = useRef<string>("");

  const nextOrder =
    questionFields.reduce((maxOrder, question) => {
      return Math.max(maxOrder, question.order);
    }, -1) + 1;

  useEffect(() => {
    if (!isCreateMode || !onQuestionsChange) {
      return;
    }

    const normalizedQuestions = (watchedQuestions ?? []).map(
      (question, questionIndex) => ({
        question: question.question,
        order: questionIndex,
        default_answers: question.default_answers.map((answer, answerIndex) => ({
          answer: answer.answer,
          order: answerIndex,
        })),
      }),
    );

    const serializedQuestions = JSON.stringify(normalizedQuestions);
    if (serializedQuestions === lastSyncedQuestionsRef.current) {
      return;
    }

    lastSyncedQuestionsRef.current = serializedQuestions;
    onQuestionsChange(normalizedQuestions);
  }, [isCreateMode, onQuestionsChange, watchedQuestions]);

  useEffect(() => {
    if (isCreateMode || !allowVoiceControls) {
      return;
    }

    let isActive = true;

    const loadVoices = async () => {
      try {
        const {
          data,
          serverError,
          validationErrors,
        } = await getElevenLabsVoicesAction({});

        if (serverError || validationErrors || !data) {
          throw new Error();
        }

        if (!isActive) {
          return;
        }

        const nextVoiceNameById: Record<string, string> = Object.fromEntries(
          data.voices.map((voice) => [voice.id, voice.name]),
        );
        const defaultVoiceId = data.defaultVoiceId?.trim();

        if (defaultVoiceId && !nextVoiceNameById[defaultVoiceId]) {
          nextVoiceNameById[defaultVoiceId] = t("forms.questions.voiceDefaultName");
        }

        setVoiceNameById(nextVoiceNameById);
      } catch {
        if (!isActive) {
          return;
        }

        setVoiceNameById({});
      }
    };

    void loadVoices();

    return () => {
      isActive = false;
    };
  }, [allowVoiceControls, isCreateMode, t]);

  const handleAddLocalQuestion = () => {
    append({
      id: crypto.randomUUID(),
      question: "",
      order: nextOrder,
      default_answers: [0, 1, 2, 3].map((answerIndex) => ({
        answer: "",
        order: answerIndex,
      })),
    });
  };

  const onSubmit = (values: EditQuestionsType) => {
    if (readOnly || isCreateMode) {
      return;
    }

    startTransition(async () => {
      try {
        const { data, serverError, validationErrors } =
          await editQuestionsAction(values);
        if (serverError || validationErrors || !data) {
          throw new Error();
        }
        toast(t("forms.questions.success"));
      } catch {
        toast(t("forms.questions.error"));
      }
    });
  };

  const handleRegenerateAll = () => {
    if (readOnly || isCreateMode || !formId) {
      return;
    }

    startRegeneratingAll(async () => {
      try {
        const { data, serverError, validationErrors } =
          await regenerateFormQuestionsTTSAction({ formId });

        if (serverError || validationErrors || !data) {
          throw new Error();
        }

        toast(t("forms.questions.ttsAllSuccess"));
        router.refresh();
      } catch {
        toast(t("forms.questions.ttsAllError"));
      }
    });
  };

  return (
    <form
      onSubmit={
        readOnly || isCreateMode
          ? (event) => {
              event.preventDefault();
            }
          : form.handleSubmit(onSubmit)
      }
      className="space-y-4"
    >
      {!readOnly && (
        <div className="flex justify-end gap-2">
          {!isCreateMode && allowVoiceControls && hasGeneratedTts && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRegenerateAll}
              disabled={isRegeneratingAll}
            >
              <WandSparklesIcon />
              {isRegeneratingAll
                ? t("forms.questions.regeneratingAll")
                : t("forms.questions.regenerateAll")}
            </Button>
          )}
          {isCreateMode ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLocalQuestion}
            >
              <PlusIcon />
              {t("forms.questions.addQuestion")}
            </Button>
          ) : (
            <AddQuestionSheet formId={formId!} nextOrder={nextOrder} />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {questionFields.map((questionField, questionIndex) => (
          <div
            key={questionField.rhfKey}
            className="space-y-3 rounded-md border p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <Controller
                name={`questions.${questionIndex}.question`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex-1">
                    <FieldLabel htmlFor={field.name}>
                      {t("forms.questions.questionLabel", {
                        index: questionIndex + 1,
                      })}
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      readOnly={readOnly}
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              {!readOnly && (
                <div className="mt-5 shrink-0">
                  {isCreateMode ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => remove(questionIndex)}
                      title={t("forms.questions.deleteQuestion")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : (
                    <DeleteQuestionButton
                      questionId={questionField.id}
                      formId={formId!}
                    />
                  )}
                </div>
              )}
            </div>

            <DefaultAnswersFields
              control={form.control}
              questionIndex={questionIndex}
              readOnly={readOnly}
            />

            {!isCreateMode && allowVoiceControls && hasGeneratedTts && (
              <p className="text-xs text-muted-foreground">
                {t("forms.questions.voiceUsed", {
                  voice: voiceLabel,
                  speed: normalizedVoiceSpeed.toFixed(2),
                })}
              </p>
            )}

            {!isCreateMode && allowVoiceControls && hasGeneratedTts && (
              <QuestionTTSControls
                questionId={questionField.id}
                formId={formId!}
                language={language}
                initialFileUrl={initialFileUrls[questionField.id] ?? null}
                readOnly={readOnly}
              />
            )}
          </div>
        ))}
      </div>

      {!readOnly && !isCreateMode && (
        <Button
          type="submit"
          className="mt-2 w-full md:w-auto"
          disabled={isPending}
        >
          {t("forms.questions.submit")}
        </Button>
      )}
    </form>
  );
}
