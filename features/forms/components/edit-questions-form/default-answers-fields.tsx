"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { DefaultAnswersFieldsProps } from "@/features/forms/types";
import { useTranslations } from "next-intl";
import { Controller, useFieldArray } from "react-hook-form";

export default function DefaultAnswersFields({
  control,
  questionIndex,
  readOnly = false,
}: DefaultAnswersFieldsProps) {
  const t = useTranslations();
  const { fields } = useFieldArray({
    control,
    name: `questions.${questionIndex}.default_answers`,
  });

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="default-answers">
        <AccordionTrigger>{t("forms.questions.defaultAnswers")}</AccordionTrigger>
        <AccordionContent className="space-y-2">
          {fields.map((field, answerIndex) => (
            <Controller
              key={field.id}
              name={`questions.${questionIndex}.default_answers.${answerIndex}.answer`}
              control={control}
              render={({ field: answerField, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...answerField}
                    id={answerField.name}
                    readOnly={readOnly}
                    aria-invalid={fieldState.invalid}
                    placeholder={t("forms.questions.answerPlaceholder", {
                      index: answerIndex + 1,
                    })}
                    autoComplete="off"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
