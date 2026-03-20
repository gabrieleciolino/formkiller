"use client";

import { Button } from "@/components/ui/button";
import { editFormAction } from "@/features/forms/actions";
import type { FormTheme, FormType } from "@/features/forms/schema";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type PublishFormButtonProps = {
  formId: string;
  name: string;
  type: FormType | null;
  theme: FormTheme | null;
  backgroundImageKey: string | null;
  backgroundMusicKey: string | null;
  introTitle: string | null;
  introMessage: string | null;
  endTitle: string | null;
  endMessage: string | null;
  allowProFeatures?: boolean;
};

export default function PublishFormButton({
  formId,
  name,
  type,
  theme,
  backgroundImageKey,
  backgroundMusicKey,
  introTitle,
  introMessage,
  endTitle,
  endMessage,
  allowProFeatures = true,
}: PublishFormButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations();

  const onPublish = () => {
    startTransition(async () => {
      try {
        const { data, serverError, validationErrors } = await editFormAction({
          formId,
          name,
          type: (allowProFeatures ? type : "default-only") ?? "default-only",
          isPublished: true,
          theme: theme ?? "dark",
          backgroundImageKey,
          backgroundMusicKey,
          introTitle: introTitle ?? "",
          introMessage: introMessage ?? "",
          endTitle: endTitle ?? "",
          endMessage: endMessage ?? "",
        });

        if (serverError || validationErrors || !data) {
          throw new Error();
        }

        toast(t("forms.edit.success"));
        router.refresh();
      } catch {
        toast(t("forms.edit.error"));
      }
    });
  };

  return (
    <Button variant="outline" onClick={onPublish} disabled={isPending}>
      {isPending
        ? t("dashboard.forms.detail.publishing")
        : t("dashboard.forms.detail.publish")}
    </Button>
  );
}

