"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  editQuestionsAction,
  generateQuestionTTSAction,
} from "@/features/forms/actions";
import {
  editQuestionsSchema,
  EditQuestionsType,
  FormLanguage,
} from "@/features/forms/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlayIcon, WandSparklesIcon } from "lucide-react";
import { startTransition, useRef, useState, useTransition } from "react";
import { Control, Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

function DefaultAnswersFields({
  control,
  qIndex,
}: {
  control: Control<EditQuestionsType>;
  qIndex: number;
}) {
  const { fields } = useFieldArray({
    control,
    name: `questions.${qIndex}.default_answers`,
  });

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="default-answers">
        <AccordionTrigger>Default answers</AccordionTrigger>
        <AccordionContent className="space-y-2">
          {fields.map((answerField, aIndex) => (
            <Controller
              key={answerField.id}
              name={`questions.${qIndex}.default_answers.${aIndex}.answer`}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={`Answer ${aIndex + 1}`}
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function QuestionTTSControls({
  questionId,
  formId,
  language,
  initialFileUrl,
}: {
  questionId: string;
  formId: string;
  language: string;
  initialFileUrl: string | null;
}) {
  const [fileUrl, setFileUrl] = useState<string | null>(initialFileUrl);
  const [isPending, startTTSTransition] = useTransition();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleGenerate = () => {
    startTTSTransition(async () => {
      try {
        const { data, serverError } = await generateQuestionTTSAction({
          questionId,
          formId,
          language,
        });

        if (serverError || !data) throw new Error();

        setFileUrl(data.url);
        toast("TTS generated.");
      } catch {
        toast("TTS generation failed.");
      }
    });
  };

  const handlePlay = () => {
    if (!fileUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(fileUrl);
    }
    audioRef.current.play();
  };

  if (fileUrl) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={handlePlay}>
        <PlayIcon />
        Play
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={isPending}
    >
      <WandSparklesIcon />
      {isPending ? "Generating..." : "Generate TTS"}
    </Button>
  );
}

export default function EditQuestionsForm({
  questionsData,
  formId,
  language,
  initialFileUrls,
}: {
  questionsData: EditQuestionsType["questions"];
  formId: string;
  language: FormLanguage;
  initialFileUrls: Record<string, string | null>;
}) {
  const form = useForm<EditQuestionsType>({
    resolver: zodResolver(editQuestionsSchema),
    values: { questions: questionsData, formId, language },
  });

  const { fields: questionFields } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const onSubmit = (values: EditQuestionsType) => {
    startTransition(async () => {
      try {
        const { data, serverError, validationErrors } =
          await editQuestionsAction(values);

        if (serverError || validationErrors || !data) {
          throw new Error();
        }

        toast("Questions successfully updated.");
      } catch {
        toast("Questions update failed.");
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {questionFields.map((questionField, qIndex) => (
          <div
            key={questionField.id}
            className="space-y-3 rounded-md border p-4"
          >
            <Controller
              name={`questions.${qIndex}.question`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Question {qIndex + 1}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <DefaultAnswersFields control={form.control} qIndex={qIndex} />
            <QuestionTTSControls
              questionId={questionsData[qIndex].id}
              formId={formId}
              language={language}
              initialFileUrl={initialFileUrls[questionsData[qIndex].id] ?? null}
            />
          </div>
        ))}
      </div>
      <Button type="submit" className="mt-2 w-full md:w-auto">
        Update
      </Button>
    </form>
  );
}
