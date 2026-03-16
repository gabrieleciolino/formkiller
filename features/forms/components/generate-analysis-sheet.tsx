"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  generateFormAnalysisInstructionsAction,
  saveFormAnalysisInstructionsAction,
} from "@/features/forms/actions";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
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
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [analysisInstructions, setAnalysisInstructions] = useState(
    initialAnalysisInstructions ?? "",
  );
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    setAnalysisInstructions(initialAnalysisInstructions ?? "");
  }, [initialAnalysisInstructions]);

  const handleGenerate = () => {
    startGenerating(async () => {
      try {
        const { data, serverError } = await generateFormAnalysisInstructionsAction(
          {
            formId,
            additionalPrompt,
          },
        );

        if (serverError || !data) {
          throw new Error();
        }

        setAnalysisInstructions(data.analysisInstructions);
        toast(t("forms.analysis.generateSuccess"));
      } catch {
        toast(t("forms.analysis.generateError"));
      }
    });
  };

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
          <Sparkles className="size-4" />
          {t("forms.analysis.trigger")}
        </Button>
      </SheetTrigger>
      <SheetContent className="gap-0 p-0">
        <SheetHeader className="pr-12">
          <SheetTitle>{t("forms.analysis.title")}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-2">
          <Field>
            <FieldLabel>{t("forms.analysis.additionalPrompt")}</FieldLabel>
            <Textarea
              value={additionalPrompt}
              onChange={(event) => setAdditionalPrompt(event.target.value)}
              rows={4}
              placeholder={t("forms.analysis.additionalPromptPlaceholder")}
            />
          </Field>

          <Button
            type="button"
            variant="secondary"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating
              ? t("forms.analysis.generating")
              : t("forms.analysis.generate")}
          </Button>

          <Field>
            <FieldLabel>{t("forms.analysis.instructions")}</FieldLabel>
            <Textarea
              value={analysisInstructions}
              onChange={(event) => setAnalysisInstructions(event.target.value)}
              rows={14}
              placeholder={t("forms.analysis.instructionsPlaceholder")}
            />
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
