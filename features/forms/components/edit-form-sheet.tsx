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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { editFormAction } from "@/features/forms/actions";
import {
  editFormSchema,
  EditFormType,
  FormType,
  formTypeSchema,
} from "@/features/forms/schema";
import { Form } from "@/features/forms/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function EditFormSheet({ formData }: { formData: Form }) {
  const [open, setOpen] = useState(false);
  const { name, instructions, id, type } = formData;
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("forms.edit");
  const tTypes = useTranslations("forms.types");

  const form = useForm<EditFormType>({
    resolver: zodResolver(editFormSchema),
    values: {
      name,
      instructions,
      formId: id,
      type: (type ?? "mixed") as FormType,
    },
  });

  const onSubmit = (values: EditFormType) => {
    startTransition(async () => {
      try {
        const {
          data: updated,
          serverError,
          validationErrors,
        } = await editFormAction(values);

        if (serverError || validationErrors || !updated) {
          throw new Error();
        }

        toast(t("success"));
        setOpen(false);
      } catch {
        toast(t("error"));
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">{t("trigger")}</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
        </SheetHeader>
        <div className="m-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>{t("name")}</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t("namePlaceholder")}
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="instructions"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>{t("instructions")}</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t("instructionsPlaceholder")}
                    autoComplete="off"
                    className="min-h-[150px]"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="type"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>{t("type")}</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(formTypeSchema.options as FormType[]).map((typeKey) => (
                        <SelectItem key={typeKey} value={typeKey}>
                          {tTypes(typeKey as Parameters<typeof tTypes>[0])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Button type="submit" className="mt-2 w-full">
              {t("submit")}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
