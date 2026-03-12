"use client";

import { Button } from "@/components/ui/button";
import { generateQuestionTTSAction } from "@/features/forms/actions";
import type { QuestionTTSControlsProps } from "@/features/forms/types";
import { PlayIcon, WandSparklesIcon } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function QuestionTTSControls({
  questionId,
  formId,
  language,
  initialFileUrl,
  readOnly = false,
}: QuestionTTSControlsProps) {
  const t = useTranslations();
  const [fileUrl, setFileUrl] = useState<string | null>(initialFileUrl);
  const [isPending, startTransition] = useTransition();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.pause();
    audioRef.current = null;
  }, [fileUrl]);

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        const { data, serverError } = await generateQuestionTTSAction({
          questionId,
          formId,
          language,
        });

        if (serverError || !data) {
          throw new Error();
        }

        setFileUrl(data.url);
        toast(t("forms.questions.ttsSuccess"));
      } catch {
        toast(t("forms.questions.ttsError"));
      }
    });
  };

  const handlePlay = () => {
    if (!fileUrl) {
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(fileUrl);
    audioRef.current = audio;
    audio.play().catch(() => {
      toast(t("forms.questions.ttsError"));
    });
  };

  return (
    <div className="flex items-center gap-2">
      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={isPending}
        >
          <WandSparklesIcon />
          {isPending
            ? t("forms.questions.generating")
            : t("forms.questions.generateTts")}
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handlePlay}
        disabled={!fileUrl}
      >
        <PlayIcon />
        {t("forms.questions.play")}
      </Button>
    </div>
  );
}
