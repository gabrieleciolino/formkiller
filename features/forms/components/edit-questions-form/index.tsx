"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { editQuestionsAction } from "@/features/forms/actions";
import {
  editQuestionsSchema,
  EditQuestionsType,
} from "@/features/forms/schema";
import type { EditQuestionsFormProps } from "@/features/forms/types";
import { useZodLocale } from "@/hooks/use-zod-locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import AddQuestionSheet from "@/features/forms/components/edit-questions-form/add-question-sheet";
import DefaultAnswersFields from "@/features/forms/components/edit-questions-form/default-answers-fields";
import DeleteQuestionButton from "@/features/forms/components/edit-questions-form/delete-question-button";
import QuestionTTSControls from "@/features/forms/components/edit-questions-form/question-tts-controls";

export default function EditQuestionsForm({
  questionsData,
  formId,
  language,
  initialFileUrls,
  readOnly = false,
}: EditQuestionsFormProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  useZodLocale();

  const form = useForm<EditQuestionsType>({
    resolver: zodResolver(editQuestionsSchema),
    defaultValues: { questions: questionsData, formId, language },
  });

  const { fields: questionFields } = useFieldArray({
    control: form.control,
    name: "questions",
    keyName: "rhfKey",
  });

  const nextOrder =
    questionFields.reduce((maxOrder, question) => {
      return Math.max(maxOrder, question.order);
    }, -1) + 1;

  const onSubmit = (values: EditQuestionsType) => {
    if (readOnly) {
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

  return (
    <form
      onSubmit={
        readOnly
          ? (event) => {
              event.preventDefault();
            }
          : form.handleSubmit(onSubmit)
      }
      className="space-y-4"
    >
      {!readOnly && (
        <div className="flex justify-end">
          <AddQuestionSheet formId={formId} nextOrder={nextOrder} />
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
                  <DeleteQuestionButton
                    questionId={questionField.id}
                    formId={formId}
                  />
                </div>
              )}
            </div>

            <DefaultAnswersFields
              control={form.control}
              questionIndex={questionIndex}
              readOnly={readOnly}
            />

            <QuestionTTSControls
              questionId={questionField.id}
              formId={formId}
              language={language}
              initialFileUrl={initialFileUrls[questionField.id] ?? null}
              readOnly={readOnly}
            />
          </div>
        ))}
      </div>

      {!readOnly && (
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
