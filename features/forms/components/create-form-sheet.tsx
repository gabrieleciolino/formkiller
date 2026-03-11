"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
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
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  createFormSchema,
  CreateFormType,
  FORM_TYPE_LABELS,
  FormType,
} from "@/features/forms/schema";
import { createFormAction } from "@/features/forms/actions";
import { useRouter } from "next/navigation";
import { urls } from "@/lib/urls";

export default function CreateFormSheet() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<CreateFormType>({
    resolver: zodResolver(createFormSchema),
    values: {
      name: "",
      instructions: "",
      type: "mixed",
    },
  });

  const onSubmit = (values: CreateFormType) => {
    startTransition(async () => {
      try {
        const {
          data: form,
          serverError,
          validationErrors,
        } = await createFormAction(values);

        if (serverError || validationErrors || !form) {
          throw new Error();
        }

        toast("Form successfully created.");
        router.push(urls.dashboard.forms.detail(form.id));
      } catch (error) {
        console.log(error);

        toast("Form creation failed.");
      }
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="lg">Create form</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="text-xl font-black">Create form</SheetTitle>
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
              Create form
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
