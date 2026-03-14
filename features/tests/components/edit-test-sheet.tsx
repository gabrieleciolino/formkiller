"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import LibraryPickerDialog from "@/features/forms/components/library-picker-dialog";
import { editTestCustomizationAction } from "@/features/tests/actions";
import {
  editTestCustomizationSchema,
  type EditTestCustomizationType,
} from "@/features/tests/schema";
import type { EditTestSheetProps } from "@/features/tests/types";
import { useZodLocale } from "@/hooks/use-zod-locale";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

export default function EditTestSheet({
  testId,
  backgroundImageKey,
  backgroundMusicKey,
  backgroundImageUrl,
  backgroundMusicUrl,
}: EditTestSheetProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  useZodLocale();

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    backgroundImageKey ? backgroundImageUrl : null,
  );
  const [musicPreviewUrl, setMusicPreviewUrl] = useState<string | null>(
    backgroundMusicKey ? backgroundMusicUrl : null,
  );

  const form = useForm<EditTestCustomizationType>({
    resolver: zodResolver(editTestCustomizationSchema),
    defaultValues: {
      testId,
      backgroundImageKey: backgroundImageKey ?? null,
      backgroundMusicKey: backgroundMusicKey ?? null,
    },
  });

  useEffect(() => {
    form.reset({
      testId,
      backgroundImageKey: backgroundImageKey ?? null,
      backgroundMusicKey: backgroundMusicKey ?? null,
    });
    setImagePreviewUrl(backgroundImageKey ? backgroundImageUrl : null);
    setMusicPreviewUrl(backgroundMusicKey ? backgroundMusicUrl : null);
  }, [
    form,
    testId,
    backgroundImageKey,
    backgroundMusicKey,
    backgroundImageUrl,
    backgroundMusicUrl,
  ]);

  const onSubmit = (values: EditTestCustomizationType) => {
    startTransition(async () => {
      try {
        const {
          data: updated,
          serverError,
          validationErrors,
        } = await editTestCustomizationAction(values);

        if (serverError || validationErrors || !updated) {
          throw new Error();
        }

        toast(t("tests.customize.success"));
        setOpen(false);
      } catch {
        toast(t("tests.customize.error"));
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="size-4" />
          {t("tests.customize.trigger")}
        </Button>
      </SheetTrigger>
      <SheetContent className="gap-0 p-0">
        <SheetHeader className="pr-12">
          <SheetTitle>{t("tests.customize.title")}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <Controller
              name="backgroundImageKey"
              control={form.control}
              render={({ field }) => (
                <LibraryPickerDialog
                  type="image"
                  value={field.value ?? null}
                  previewUrl={imagePreviewUrl}
                  onChange={(nextKey, previewUrl) => {
                    field.onChange(nextKey ?? null);
                    setImagePreviewUrl(previewUrl ?? null);
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
                  previewUrl={musicPreviewUrl}
                  onChange={(nextKey, previewUrl) => {
                    field.onChange(nextKey ?? null);
                    setMusicPreviewUrl(previewUrl ?? null);
                  }}
                />
              )}
            />

            <Button type="submit" disabled={isPending} className="w-full">
              {t("tests.customize.save")}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
