"use client";

import {
  CreateForm,
  createFormSchema,
} from "@/app/dashboard/forms/__components/schema";
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
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";

export default function CreateFormSheet() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateForm>({
    resolver: zodResolver(createFormSchema),
    values: {
      name: "",
      instructions: "",
    },
  });

  const onSubmit = (values: CreateForm) => {
    startTransition(async () => {});
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
            <Button type="submit" className="mt-2 w-full">
              Create form
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
