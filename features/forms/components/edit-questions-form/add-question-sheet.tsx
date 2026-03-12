"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { addQuestionAction } from "@/features/forms/actions";
import { addQuestionFormSchema } from "@/features/forms/schema";
import type {
  AddQuestionFormValues,
  AddQuestionSheetProps,
} from "@/features/forms/types";
import { useZodLocale } from "@/hooks/use-zod-locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

export default function AddQuestionSheet({
  formId,
  nextOrder,
}: AddQuestionSheetProps) {
  const t = useTranslations();
  useZodLocale();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AddQuestionFormValues>({
    resolver: zodResolver(addQuestionFormSchema),
    defaultValues: {
      question: "",
      answers: ["", "", "", ""],
    },
  });

  const onSubmit = (values: AddQuestionFormValues) => {
    startTransition(async () => {
      try {
        const { serverError } = await addQuestionAction({
          formId,
          question: values.question,
          answers: [...values.answers],
        });

        if (serverError) {
          throw new Error();
        }

        form.reset();
        setOpen(false);
      } catch {
        toast(t("forms.questions.addQuestionError"));
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <PlusIcon />
          {t("forms.questions.addQuestion")}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-roboto text-xl font-black">
            {t("forms.questions.addQuestionTitle")}
          </SheetTitle>
        </SheetHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-6 space-y-4 px-4"
        >
          <Controller
            name="question"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  {t("forms.questions.questionLabel", { index: nextOrder + 1 })}
                </FieldLabel>
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

          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t("forms.questions.defaultAnswers")}
            </p>
            {([0, 1, 2, 3] as const).map((index) => (
              <Controller
                key={index}
                name={`answers.${index}`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder={t("forms.questions.answerPlaceholder", {
                        index: index + 1,
                      })}
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {t("forms.questions.addQuestionSubmit")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
