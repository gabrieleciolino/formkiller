"use client";

import { RecordingButton } from "@/features/forms/components/form-viewer/recording-button";
import type { FormViewerQuestionPhaseProps } from "@/features/forms/types";
import {
  CheckCircleIcon,
  MicIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

export function QuestionPhase({
  answer,
  autoStopped,
  bgStyle,
  currentIndex,
  displayedText,
  hasBackgroundImage,
  hasBackgroundMusic,
  isDark,
  isLast,
  isMuted,
  isPending,
  onAdvance,
  onResetRecording,
  onSelectDefault,
  onStartRecording,
  onStopRecording,
  onToggleMute,
  questions,
  recordState,
  showDefaultAnswers,
  showRecording,
  tk,
}: FormViewerQuestionPhaseProps) {
  const t = useTranslations();
  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return null;
  }

  return (
    <div
      className={`relative flex min-h-dvh flex-col ${tk.bg} ${tk.text}`}
      style={bgStyle}
    >
      {hasBackgroundImage && <div className={`absolute inset-0 ${tk.overlay}`} />}

      <div className="relative flex items-center gap-3 px-6 pt-8 pb-2">
        <div className="flex flex-1 gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-0.5 w-8 rounded-full transition-all duration-500 ${
                i < currentIndex
                  ? tk.progressActive
                  : i === currentIndex
                    ? tk.progressCurrent
                    : tk.progressInactive
              }`}
            />
          ))}
        </div>

        <span
          className={`shrink-0 whitespace-nowrap text-xs tabular-nums ${tk.progressText}`}
        >
          {currentIndex + 1} / {questions.length}
        </span>

        {hasBackgroundMusic && (
          <button
            onClick={onToggleMute}
            className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-colors ${tk.muteBtn}`}
          >
            {isMuted ? (
              <VolumeXIcon className="size-3.5" />
            ) : (
              <Volume2Icon className="size-3.5" />
            )}
          </button>
        )}
      </div>

      <div className="relative flex flex-1 items-center justify-center px-6 py-10">
        <p className="text-center text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
          {displayedText}
          <span
            className={`ml-px inline-block h-6 w-0.5 align-middle ${tk.cursor}`}
          />
        </p>
      </div>

      <div className={`relative mx-4 mb-10 space-y-3 rounded-2xl p-4 ${isDark ? "bg-black/80" : "bg-white/80"}`}>
        {showDefaultAnswers && (
          <div className="grid grid-cols-2 gap-2">
            {currentQuestion.defaultAnswers.map((defaultAnswer, index) => {
              const isSelected =
                answer?.type === "default" && answer.text === defaultAnswer.answer;

              return (
                <button
                  key={index}
                  onClick={() => onSelectDefault(defaultAnswer.answer)}
                  className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium leading-snug transition-all active:scale-95 ${
                    isSelected ? tk.cardSelected : tk.cardIdle
                  }`}
                >
                  {defaultAnswer.answer}
                </button>
              );
            })}
          </div>
        )}

        {showRecording && (
          <div className="flex flex-col items-center gap-2 py-1">
            {recordState === "idle" && (
              <>
                <button
                  onClick={onStartRecording}
                  className={`flex size-14 items-center justify-center rounded-full border transition-all active:scale-95 ${tk.recordIdle}`}
                >
                  <MicIcon className="size-5" />
                </button>
                <p className={`text-center text-xs ${tk.recordHint}`}>
                  {t("viewer.question.recordHint")}
                </p>
              </>
            )}

            {recordState === "recording" && (
              <RecordingButton onStop={onStopRecording} />
            )}

            {recordState === "done" && (
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-green-500/25 bg-green-500/10 px-4 py-2 text-sm text-green-400">
                    <CheckCircleIcon className="size-4" />
                    {t("viewer.question.recorded")}
                  </div>

                  <button
                    onClick={onResetRecording}
                    className={`text-xs underline ${tk.reRecord}`}
                  >
                    {t("viewer.question.reRecord")}
                  </button>
                </div>

                {autoStopped && (
                  <p className="text-xs text-amber-400/70">
                    {t("viewer.question.recordAutoStopped")}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={onAdvance}
          disabled={!answer || isPending}
          className={`w-full rounded-2xl py-4 text-sm font-semibold transition-all hover:opacity-90 active:scale-95 ${tk.cta} ${tk.ctaDisabled}`}
        >
          {isPending ? "..." : isLast ? t("viewer.question.finish") : t("viewer.question.next")}
        </button>
      </div>
    </div>
  );
}
