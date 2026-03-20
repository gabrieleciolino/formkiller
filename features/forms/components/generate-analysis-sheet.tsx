"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { saveFormAnalysisInstructionsAction } from "@/features/forms/actions";
import { ANALYSIS_INSTRUCTIONS_MAX_LENGTH } from "@/features/forms/schema";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

type GenerateAnalysisSheetProps = {
  formId: string;
  initialAnalysisInstructions: string | null;
};

export default function GenerateAnalysisSheet({
  formId,
  initialAnalysisInstructions,
}: GenerateAnalysisSheetProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [analysisInstructions, setAnalysisInstructions] = useState(
    (initialAnalysisInstructions ?? "").slice(0, ANALYSIS_INSTRUCTIONS_MAX_LENGTH),
  );
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    setAnalysisInstructions(
      (initialAnalysisInstructions ?? "").slice(0, ANALYSIS_INSTRUCTIONS_MAX_LENGTH),
    );
  }, [initialAnalysisInstructions]);
  const characterCount = analysisInstructions.length;

  const handleSave = () => {
    startSaving(async () => {
      try {
        const { data, serverError } = await saveFormAnalysisInstructionsAction({
          formId,
          analysisInstructions,
        });

        if (serverError || !data) {
          throw new Error();
        }

        setAnalysisInstructions(data.analysisInstructions ?? "");
        toast(t("forms.analysis.saveSuccess"));
        setOpen(false);
      } catch {
        toast(t("forms.analysis.saveError"));
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="size-4" />
          {t("forms.analysis.trigger")}
        </Button>
      </SheetTrigger>
      <SheetContent className="gap-0 p-0">
        <SheetHeader className="pr-12">
          <SheetTitle>{t("forms.analysis.title")}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-2">
          <Field>
            <FieldLabel>{t("forms.analysis.instructions")}</FieldLabel>
            <Textarea
              value={analysisInstructions}
              onChange={(event) =>
                setAnalysisInstructions(
                  event.target.value.slice(0, ANALYSIS_INSTRUCTIONS_MAX_LENGTH),
                )
              }
              rows={14}
              maxLength={ANALYSIS_INSTRUCTIONS_MAX_LENGTH}
              placeholder={t("forms.analysis.instructionsPlaceholder")}
            />
            <FieldDescription className="text-right">
              {t("forms.analysis.characterCount", {
                count: characterCount,
                max: ANALYSIS_INSTRUCTIONS_MAX_LENGTH,
              })}
            </FieldDescription>
          </Field>

          <Button
            type="button"
            className="w-full"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? t("forms.analysis.saving") : t("forms.analysis.save")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
