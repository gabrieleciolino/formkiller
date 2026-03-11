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
  FORM_TYPE_LABELS,
  FormType,
} from "@/features/forms/schema";
import { Form } from "@/features/forms/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

export default function EditFormSheet({ formData }: { formData: Form }) {
  const [open, setOpen] = useState(false);
  const { name, instructions, id, type } = formData;
  const [isPending, startTransition] = useTransition();

  const form = useForm<EditFormType>({
    resolver: zodResolver(editFormSchema),
    values: { name, instructions, formId: id, type: (type ?? "mixed") as FormType },
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

        toast("Form successfully updated.");
        setOpen(false);
      } catch {
        toast("Form update failed.");
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">Edit Form</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Form</SheetTitle>
        </SheetHeader>
        <div className="m-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Name"
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
                  <FieldLabel htmlFor={field.name}>Instructions</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Instructions"
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
                  <FieldLabel>Type</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(FORM_TYPE_LABELS) as FormType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {FORM_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Button type="submit" className="mt-2 w-full">
              Update form
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
