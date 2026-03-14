"use client";

import { Button } from "@/components/ui/button";
import { saveTestResultAction } from "@/features/tests/public-actions";
import type { TestViewerProps } from "@/features/tests/types";
import { urls } from "@/lib/urls";
import { cn } from "@/lib/utils";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

type ViewerPhase = "welcome" | "question" | "completed";
type ScoreTotals = [number, number, number, number];

function addScores(current: ScoreTotals, next: ScoreTotals): ScoreTotals {
  return [
    current[0] + next[0],
    current[1] + next[1],
    current[2] + next[2],
    current[3] + next[3],
  ];
}

function getWinnerProfileIndex(scoreTotals: ScoreTotals) {
  let winner = 0;
  for (let index = 1; index < scoreTotals.length; index += 1) {
    if (scoreTotals[index] > scoreTotals[winner]) {
      winner = index;
    }
  }
  return winner;
}

const ANSWER_LABELS = ["A", "B", "C", "D"];

function TestViewerContent({ test }: Pick<TestViewerProps, "test">) {
  const t = useTranslations();
  const [phase, setPhase] = useState<ViewerPhase>("welcome");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswerOrder, setSelectedAnswerOrder] = useState<number | null>(
    null,
  );
  const [scoreTotals, setScoreTotals] = useState<ScoreTotals>([0, 0, 0, 0]);
  const [answerSelections, setAnswerSelections] = useState<
    Array<{
      questionId: string;
      answerOrder: number;
      scores: ScoreTotals;
    }>
  >([]);
  const [winnerProfileIndex, setWinnerProfileIndex] = useState<number | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);

  const currentQuestion = test.questions[currentIndex];
  const isLastQuestion = currentIndex === test.questions.length - 1;
  const progressPercent =
    phase === "completed"
      ? 100
      : phase === "question"
        ? Math.round((currentIndex / test.questions.length) * 100)
        : 0;

  useEffect(() => {
    if (phase !== "question") return;
    const url = currentQuestion?.audioUrl;
    if (!url) return;
    audioRef.current?.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    void audio.play().catch(() => null);
    return () => {
      audio.pause();
    };
  }, [currentQuestion?.audioUrl, phase]);

  const winnerProfile = useMemo(() => {
    if (winnerProfileIndex === null) return null;
    return test.profiles[winnerProfileIndex] ?? null;
  }, [test.profiles, winnerProfileIndex]);

  const handleStart = () => {
    setCurrentIndex(0);
    setScoreTotals([0, 0, 0, 0]);
    setAnswerSelections([]);
    setSelectedAnswerOrder(null);
    setWinnerProfileIndex(null);
    setPhase("question");

    const backgroundMusic = backgroundMusicRef.current;
    if (!backgroundMusic) return;
    backgroundMusic.currentTime = 0;
    backgroundMusic.volume = 0.35;
    void backgroundMusic.play().catch(() => null);
  };

  const handleAdvance = () => {
    if (!currentQuestion || selectedAnswerOrder === null) return;

    const selectedAnswer = currentQuestion.answers.find(
      (answer) => answer.order === selectedAnswerOrder,
    );
    if (!selectedAnswer) return;

    const nextTotals = addScores(scoreTotals, selectedAnswer.scores);
    const nextSelections = [
      ...answerSelections,
      {
        questionId: currentQuestion.id,
        answerOrder: selectedAnswer.order,
        scores: selectedAnswer.scores,
      },
    ];

    if (isLastQuestion) {
      const profileIndex = getWinnerProfileIndex(nextTotals);
      const winnerProfileId = test.profiles[profileIndex]?.id;

      setScoreTotals(nextTotals);
      setAnswerSelections(nextSelections);
      setWinnerProfileIndex(profileIndex);
      setPhase("completed");

      if (!winnerProfileId) return;

      startTransition(async () => {
        try {
          const { serverError } = await saveTestResultAction({
            testId: test.id,
            profileId: winnerProfileId,
            language: test.language,
            scoreTotals: nextTotals,
            answerSelections: nextSelections,
          });
          if (serverError) throw new Error();
        } catch {
          toast(t("testViewer.errors.saveResult"));
        }
      });
      return;
    }

    setScoreTotals(nextTotals);
    setAnswerSelections(nextSelections);
    setSelectedAnswerOrder(null);
    setCurrentIndex((index) => index + 1);
  };

  const hasBackground = !!test.backgroundImageUrl;

  const containerClassName = cn(
    "relative flex min-h-dvh flex-col items-center px-4 py-5",
    hasBackground
      ? "bg-cover bg-center bg-no-repeat"
      : "bg-gradient-to-br from-background via-muted/30 to-background",
  );
  const containerStyle = hasBackground
    ? { backgroundImage: `url(${test.backgroundImageUrl})` }
    : undefined;

  const cardClassName = cn(
    "w-full max-w-xl rounded-2xl border border-border/60 shadow-2xl",
    hasBackground ? "bg-card/90 backdrop-blur-md" : "bg-card",
  );

  const content =
    phase === "welcome" ? (
      <div className={cn(cardClassName, "overflow-hidden")}>
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
        <div className="space-y-6 p-8 text-center">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              Quiz
            </span>
            <h1 className="font-roboto text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              {test.introTitle || test.name}
            </h1>
            <p className="mx-auto max-w-sm whitespace-pre-line text-base leading-relaxed text-muted-foreground">
              {test.introMessage || t("testViewer.welcome.defaultMessage")}
            </p>
          </div>

          {test.questions.length > 0 && (
            <div className="flex items-center justify-center gap-1.5">
              {Array.from({ length: Math.min(test.questions.length, 12) }).map(
                (_, i) => (
                  <div key={i} className="h-1.5 w-5 rounded-full bg-muted" />
                ),
              )}
              {test.questions.length > 12 && (
                <span className="text-xs text-muted-foreground">
                  +{test.questions.length - 12}
                </span>
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {test.questions.length}{" "}
              {test.questions.length === 1 ? "domanda" : "domande"}
            </p>
            <Button
              size="lg"
              onClick={handleStart}
              className="w-full font-bold text-base"
            >
              {t("testViewer.welcome.start")}
              <span className="ml-1">→</span>
            </Button>
          </div>
        </div>
      </div>
    ) : phase === "completed" ? (
      <div className={cn(cardClassName, "overflow-hidden")}>
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
        <div className="space-y-6 p-8">
          <div className="space-y-3 text-center">
            <div className="text-5xl">🎉</div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              {t("testViewer.completed.badge")}
            </p>
            <h1 className="font-roboto text-3xl font-black tracking-tight">
              {test.endTitle || t("testViewer.completed.title")}
            </h1>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {test.endMessage || t("testViewer.completed.defaultMessage")}
            </p>
          </div>

          {winnerProfile ? (
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  Il tuo profilo
                </p>
              </div>
              <h2 className="font-roboto text-2xl font-black text-foreground">
                {winnerProfile.title}
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {winnerProfile.description}
              </p>
            </div>
          ) : null}

          <Button
            variant="outline"
            onClick={handleStart}
            className="w-full font-semibold"
            size="lg"
          >
            {t("testViewer.completed.restart")}
          </Button>

          {isPending ? (
            <p className="text-center text-xs text-muted-foreground">
              {t("testViewer.completed.saving")}
            </p>
          ) : null}
        </div>
      </div>
    ) : (
      <div className={cn(cardClassName, "overflow-hidden")}>
        {/* Progress bar */}
        <div className="h-1.5 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="space-y-6 p-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              {t("testViewer.question.progress", {
                current: currentIndex + 1,
                total: test.questions.length,
              })}
            </span>
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {progressPercent}%
            </span>
          </div>

          {/* Question */}
          <h1 className="font-roboto text-2xl font-black leading-snug tracking-tight">
            {currentQuestion?.question}
          </h1>

          {/* Answers */}
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion?.answers.map((answer, i) => {
              const selected = selectedAnswerOrder === answer.order;
              return (
                <button
                  key={answer.order}
                  type="button"
                  onClick={() => setSelectedAnswerOrder(answer.order)}
                  className={cn(
                    "group flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    selected
                      ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-colors",
                      selected
                        ? "bg-white/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                    )}
                  >
                    {ANSWER_LABELS[i] ?? i + 1}
                  </span>
                  <span className="leading-snug">{answer.answer}</span>
                </button>
              );
            })}
          </div>

          <Button
            onClick={handleAdvance}
            disabled={selectedAnswerOrder === null}
            className="w-full font-bold"
            size="lg"
          >
            {isLastQuestion
              ? t("testViewer.question.finish")
              : t("testViewer.question.next")}
            <span className="ml-1">→</span>
          </Button>
        </div>
      </div>
    );

  return (
    <div className={containerClassName} style={containerStyle}>
      {test.backgroundMusicUrl ? (
        <audio
          ref={backgroundMusicRef}
          src={test.backgroundMusicUrl}
          loop
          preload="auto"
        />
      ) : null}

      <div className="flex w-full justify-center">
        <Image
          src="/logo-seituilproblema.png"
          alt="Sei Tu Il Problema"
          width={220}
          height={54}
          className="h-auto w-[160px] sm:w-[190px]"
          priority
        />
      </div>

      <div className="flex w-full flex-1 items-center justify-center">
        {content}
      </div>

      <div className="mt-6 flex flex-col items-center gap-1 pb-2">
        <p className="text-[10px] font-medium uppercase tracking-widest text-black/30">
          powered by
        </p>
        <Link href={urls.home}>
          <Image
            src="/logo.png"
            alt="FormKiller"
            width={120}
            height={31}
            priority
          />
        </Link>
      </div>
    </div>
  );
}

export default function TestViewer({
  test,
  locale,
  messages,
}: TestViewerProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <TestViewerContent test={test} />
    </NextIntlClientProvider>
  );
}
