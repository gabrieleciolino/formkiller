"use client";

import { LandingContactTechBackground } from "@/features/forms/components/form-viewer/landing-contact-tech-background";
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
  showLandingContactTechBackground,
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
      className={`relative flex h-dvh flex-col overflow-hidden ${tk.bg} ${tk.text}`}
      style={bgStyle}
    >
      {showLandingContactTechBackground && <LandingContactTechBackground />}

      {hasBackgroundImage && (
        <div className={`absolute inset-0 ${tk.overlay}`} />
      )}

      <div className="relative mx-auto flex h-full w-full max-w-md flex-col">
        <div className={`relative mx-4 mt-6 shrink-0 rounded-2xl px-4 py-3 ${isDark ? "bg-black/90" : "bg-white/90"}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex min-w-0 flex-1 gap-1.5">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-0.5 min-w-0 flex-1 rounded-full transition-all duration-500 ${
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
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-6 py-4">
          <p className={`text-center text-2xl font-semibold leading-snug tracking-tight sm:text-3xl ${tk.textShadow}`}>
            {displayedText}
            <span
              className={`ml-px inline-block h-6 w-0.5 align-middle ${tk.cursor}`}
            />
          </p>
        </div>

        {showRecording && (
          <div className="relative flex shrink-0 flex-col items-center gap-2 pb-3">
            {recordState === "idle" && (
              <>
                <button
                  onClick={onStartRecording}
                  className={`flex size-20 items-center justify-center rounded-full border-2 transition-all active:scale-95  ${tk.recordIdle}`}
                >
                  <MicIcon className="size-8" />
                </button>
                <p className={`text-center text-xs font-semibold ${tk.recordHint} ${tk.textShadow}`}>
                  {t("viewer.question.recordHint")}
                </p>
              </>
            )}

            {recordState === "recording" && (
              <RecordingButton onStop={onStopRecording} isDark={isDark} />
            )}

          </div>
        )}

        <div
          className={`relative mx-4 mb-6 shrink-0 space-y-3 rounded-2xl p-4 ${isDark ? "bg-black/90" : "bg-white/90"}`}
        >
          {showRecording && recordState === "done" && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium ${isDark ? "text-green-400" : "text-green-600"}`}>
                  <CheckCircleIcon className="size-4" />
                  {t("viewer.question.recorded")}
                </div>
                <button
                  onClick={onResetRecording}
                  className={`text-xs font-medium transition-all active:scale-95 ${tk.reRecord}`}
                >
                  {t("viewer.question.reRecord")}
                </button>
              </div>
              {autoStopped && (
                <p className={`text-xs font-medium ${isDark ? "text-amber-300" : "text-amber-600"}`}>
                  {t("viewer.question.recordAutoStopped")}
                </p>
              )}
            </div>
          )}

          {showDefaultAnswers && recordState !== "done" && (
            <>
              {showRecording && (
                <p className={`text-center text-xs ${tk.recordHint}`}>
                  {t("viewer.question.orPickAnswer")}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {currentQuestion.defaultAnswers.map((defaultAnswer, index) => {
                  const isSelected =
                    answer?.type === "default" &&
                    answer.text === defaultAnswer.answer;

                  return (
                    <button
                      key={index}
                      onClick={() => onSelectDefault(defaultAnswer.answer)}
                      className={`rounded-2xl border px-4 py-4 text-left text-xs md:text-sm font-medium leading-snug transition-all active:scale-95 ${
                        isSelected ? tk.cardSelected : tk.cardIdle
                      }`}
                    >
                      {defaultAnswer.answer}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <button
            onClick={onAdvance}
            disabled={!answer || isPending}
            className={`w-full rounded-2xl py-4 text-sm font-semibold transition-all hover:opacity-90 active:scale-95 ${tk.cta} ${tk.ctaDisabled}`}
          >
            {isPending
              ? "..."
              : isLast
                ? t("viewer.question.finish")
                : t("viewer.question.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
