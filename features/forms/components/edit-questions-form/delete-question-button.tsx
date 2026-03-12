"use client";

import { Button } from "@/components/ui/button";
import { deleteQuestionAction } from "@/features/forms/actions";
import type { DeleteQuestionButtonProps } from "@/features/forms/types";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

export default function DeleteQuestionButton({
  questionId,
  formId,
}: DeleteQuestionButtonProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(t("forms.questions.confirmDeleteQuestion"))) {
      return;
    }

    startTransition(async () => {
      try {
        const { serverError } = await deleteQuestionAction({ questionId, formId });
        if (serverError) {
          throw new Error();
        }
      } catch {
        toast(t("forms.questions.deleteQuestionError"));
      }
    });
  };

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      onClick={handleDelete}
      disabled={isPending}
      title={t("forms.questions.deleteQuestion")}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
