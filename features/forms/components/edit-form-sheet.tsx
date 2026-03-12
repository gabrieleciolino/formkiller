"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { Moon, SlidersHorizontal, Sun } from "lucide-react";
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
  const {
    id,
    name,
    type,
    theme,
    background_image_key,
    background_music_key,
    intro_title,
    intro_message,
    end_title,
    end_message,
  } = formData;
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
      formId: id,
      name,
      type: (type ?? "mixed") as FormType,
      theme: (theme ?? "dark") as FormTheme,
      backgroundImageKey: background_image_key ?? null,
      backgroundMusicKey: background_music_key ?? null,
      introTitle: intro_title ?? "",
      introMessage: intro_message ?? "",
      endTitle: end_title ?? "",
      endMessage: end_message ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      formId: id,
      name,
      type: (type ?? "mixed") as FormType,
      theme: (theme ?? "dark") as FormTheme,
      backgroundImageKey: background_image_key ?? null,
      backgroundMusicKey: background_music_key ?? null,
      introTitle: intro_title ?? "",
      introMessage: intro_message ?? "",
      endTitle: end_title ?? "",
      endMessage: end_message ?? "",
    });
    setImagePreviewUrl(background_image_key ? backgroundImageUrl : null);
    setMusicPreviewUrl(background_music_key ? backgroundMusicUrl : null);
  }, [
    id,
    name,
    theme,
    type,
    backgroundImageUrl,
    backgroundMusicUrl,
    background_image_key,
    background_music_key,
    intro_title,
    intro_message,
    end_title,
    end_message,
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
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="size-4" />
          {t("forms.edit.trigger")}
        </Button>
      </SheetTrigger>
      <SheetContent className="gap-0 p-0">
        <SheetHeader className="pr-12">
          <SheetTitle>{t("forms.edit.title")}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-2"
          >
            <Controller
              name="name"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>{t("forms.edit.name")}</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder={t("forms.edit.namePlaceholder")}
                  />
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
              name="introTitle"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>{t("forms.edit.introTitle")}</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    rows={2}
                    placeholder={t("forms.edit.introTitlePlaceholder")}
                  />
                </Field>
              )}
            />
            <Controller
              name="introMessage"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>{t("forms.edit.introMessage")}</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    rows={3}
                    placeholder={t("forms.edit.introMessagePlaceholder")}
                  />
                </Field>
              )}
            />
            <Controller
              name="endTitle"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>{t("forms.edit.endTitle")}</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    rows={2}
                    placeholder={t("forms.edit.endTitlePlaceholder")}
                  />
                </Field>
              )}
            />
            <Controller
              name="endMessage"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>{t("forms.edit.endMessage")}</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    rows={3}
                    placeholder={t("forms.edit.endMessagePlaceholder")}
                  />
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
