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
  FormTheme,
  FormType,
  formTypeSchema,
} from "@/features/forms/schema";
import { Moon, Sun } from "lucide-react";
import type { EditFormSheetProps } from "@/features/forms/types";
import LibraryPickerDialog from "@/features/forms/components/library-picker-dialog";
import { useZodLocale } from "@/hooks/use-zod-locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function EditFormSheet({
  formData,
  backgroundImageUrl,
  backgroundMusicUrl,
}: EditFormSheetProps) {
  const [open, setOpen] = useState(false);
  const { name, instructions, id, type, theme, background_image_key, background_music_key } = formData;
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();
  useZodLocale();
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    background_image_key ? backgroundImageUrl : null,
  );
  const [musicPreviewUrl, setMusicPreviewUrl] = useState<string | null>(
    background_music_key ? backgroundMusicUrl : null,
  );

  const form = useForm<EditFormType>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name,
      instructions,
      formId: id,
      type: (type ?? "mixed") as FormType,
      theme: (theme ?? "dark") as FormTheme,
      backgroundImageKey: background_image_key ?? null,
      backgroundMusicKey: background_music_key ?? null,
    },
  });

  useEffect(() => {
    form.reset({
      name,
      instructions,
      formId: id,
      type: (type ?? "mixed") as FormType,
      theme: (theme ?? "dark") as FormTheme,
      backgroundImageKey: background_image_key ?? null,
      backgroundMusicKey: background_music_key ?? null,
    });
    setImagePreviewUrl(background_image_key ? backgroundImageUrl : null);
    setMusicPreviewUrl(background_music_key ? backgroundMusicUrl : null);
  }, [
    id,
    instructions,
    name,
    theme,
    type,
    backgroundImageUrl,
    backgroundMusicUrl,
    background_image_key,
    background_music_key,
    form,
  ]);

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

        toast(t("forms.edit.success"));
        setOpen(false);
      } catch {
        toast(t("forms.edit.error"));
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">{t("forms.edit.trigger")}</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("forms.edit.title")}</SheetTitle>
        </SheetHeader>
        <div className="m-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t("forms.edit.name")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t("forms.edit.namePlaceholder")}
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
                  <FieldLabel htmlFor={field.name}>
                    {t("forms.edit.instructions")}
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t("forms.edit.instructionsPlaceholder")}
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
                  <FieldLabel>{t("forms.edit.type")}</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(formTypeSchema.options as FormType[]).map((typeKey) => (
                        <SelectItem key={typeKey} value={typeKey}>
                          {t(
                            `forms.types.${typeKey}` as Parameters<typeof t>[0],
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Controller
              name="theme"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>{t("forms.edit.theme")}</FieldLabel>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    {(["dark", "light"] as FormTheme[]).map((themeKey) => {
                      const selected = field.value === themeKey;
                      return (
                        <button
                          key={themeKey}
                          type="button"
                          onClick={() => field.onChange(themeKey)}
                          className={`flex flex-1 items-center justify-center gap-2 py-2 text-sm transition-colors ${
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {themeKey === "dark" ? (
                            <Moon className="size-4" />
                          ) : (
                            <Sun className="size-4" />
                          )}
                          {t(
                            `forms.edit.themes.${themeKey}` as Parameters<
                              typeof t
                            >[0],
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              )}
            />
            <Controller
              name="backgroundImageKey"
              control={form.control}
              render={({ field }) => (
                <LibraryPickerDialog
                  type="image"
                  value={field.value ?? null}
                  previewUrl={field.value ? imagePreviewUrl : null}
                  onChange={(nextKey, nextPreview) => {
                    field.onChange(nextKey);
                    if (!nextKey) {
                      setImagePreviewUrl(null);
                      return;
                    }

                    if (nextPreview) {
                      setImagePreviewUrl(nextPreview);
                    }
                  }}
                />
              )}
            />
            <Controller
              name="backgroundMusicKey"
              control={form.control}
              render={({ field }) => (
                <LibraryPickerDialog
                  type="audio"
                  value={field.value ?? null}
                  previewUrl={field.value ? musicPreviewUrl : null}
                  onChange={(nextKey, nextPreview) => {
                    field.onChange(nextKey);
                    if (!nextKey) {
                      setMusicPreviewUrl(null);
                      return;
                    }

                    if (nextPreview) {
                      setMusicPreviewUrl(nextPreview);
                    }
                  }}
                />
              )}
            />
            <Button type="submit" className="mt-2 w-full" disabled={isPending}>
              {t("forms.edit.submit")}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
