"use client";

import { Button } from "@/components/ui/button";
import { saveTestResultAction } from "@/features/tests/public-actions";
import type { TestViewerProps } from "@/features/tests/types";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
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

export default function TestViewer({ test }: TestViewerProps) {
  const t = useTranslations();
  const [phase, setPhase] = useState<ViewerPhase>("welcome");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswerOrder, setSelectedAnswerOrder] = useState<number | null>(null);
  const [scoreTotals, setScoreTotals] = useState<ScoreTotals>([0, 0, 0, 0]);
  const [answerSelections, setAnswerSelections] = useState<
    Array<{
      questionId: string;
      answerOrder: number;
      scores: ScoreTotals;
    }>
  >([]);
  const [winnerProfileIndex, setWinnerProfileIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);

  const currentQuestion = test.questions[currentIndex];
  const isLastQuestion = currentIndex === test.questions.length - 1;

  useEffect(() => {
    if (phase !== "question") {
      return;
    }

    const url = currentQuestion?.audioUrl;
    if (!url) {
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    void audio.play().catch(() => null);

    return () => {
      audio.pause();
    };
  }, [currentQuestion?.audioUrl, phase]);

  const winnerProfile = useMemo(() => {
    if (winnerProfileIndex === null) {
      return null;
    }

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
    if (!backgroundMusic) {
      return;
    }

    backgroundMusic.currentTime = 0;
    backgroundMusic.volume = 0.35;
    void backgroundMusic.play().catch(() => null);
  };

  const handleAdvance = () => {
    if (!currentQuestion || selectedAnswerOrder === null) {
      return;
    }

    const selectedAnswer = currentQuestion.answers.find(
      (answer) => answer.order === selectedAnswerOrder,
    );

    if (!selectedAnswer) {
      return;
    }

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

      if (!winnerProfileId) {
        return;
      }

      startTransition(async () => {
        try {
          const { serverError } = await saveTestResultAction({
            testId: test.id,
            profileId: winnerProfileId,
            language: test.language,
            scoreTotals: nextTotals,
            answerSelections: nextSelections,
          });

          if (serverError) {
            throw new Error();
          }
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

  const containerClassName = cn(
    "flex min-h-dvh items-center justify-center px-4 py-8 text-foreground",
    test.backgroundImageUrl ? "bg-cover bg-center bg-no-repeat" : "bg-background",
  );
  const containerStyle = test.backgroundImageUrl
    ? { backgroundImage: `url(${test.backgroundImageUrl})` }
    : undefined;
  const cardClassName = cn(
    "w-full max-w-xl space-y-4 rounded-lg border border-border p-6 shadow-sm",
    test.backgroundImageUrl ? "bg-card/90 backdrop-blur-sm" : "bg-card",
  );

  const content =
    phase === "welcome" ? (
      <div className={cn(cardClassName, "text-center")}>
        <h1 className="text-3xl font-bold tracking-tight">
          {test.introTitle || test.name}
        </h1>
        <p className="whitespace-pre-line text-sm text-muted-foreground">
          {test.introMessage || t("testViewer.welcome.defaultMessage")}
        </p>
        <Button onClick={handleStart} className="w-full md:w-auto">
          {t("testViewer.welcome.start")}
        </Button>
      </div>
    ) : phase === "completed" ? (
      <div className={cardClassName}>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("testViewer.completed.badge")}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          {test.endTitle || t("testViewer.completed.title")}
        </h1>
        <p className="whitespace-pre-line text-sm text-muted-foreground">
          {test.endMessage || t("testViewer.completed.defaultMessage")}
        </p>

        {winnerProfile ? (
          <div className="space-y-2 rounded-md border border-border bg-background p-4">
            <h2 className="text-xl font-semibold text-foreground">
              {winnerProfile.title}
            </h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {winnerProfile.description}
            </p>
          </div>
        ) : null}

        <Button variant="outline" onClick={handleStart} className="w-full md:w-auto">
          {t("testViewer.completed.restart")}
        </Button>

        {isPending ? (
          <p className="text-xs text-muted-foreground">
            {t("testViewer.completed.saving")}
          </p>
        ) : null}
      </div>
    ) : (
      <div className={cardClassName}>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("testViewer.question.progress", {
            current: currentIndex + 1,
            total: test.questions.length,
          })}
        </p>

        <h1 className="text-2xl font-semibold leading-snug tracking-tight">
          {currentQuestion?.question}
        </h1>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {currentQuestion?.answers.map((answer) => {
            const selected = selectedAnswerOrder === answer.order;

            return (
              <button
                key={answer.order}
                type="button"
                className={cn(
                  "rounded-md border px-4 py-3 text-left text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted",
                )}
                onClick={() => setSelectedAnswerOrder(answer.order)}
              >
                {answer.answer}
              </button>
            );
          })}
        </div>

        <Button
          onClick={handleAdvance}
          disabled={selectedAnswerOrder === null}
          className="w-full md:w-auto"
        >
          {isLastQuestion
            ? t("testViewer.question.finish")
            : t("testViewer.question.next")}
        </Button>
      </div>
    );

  return (
    <div className={containerClassName} style={containerStyle}>
      {test.backgroundMusicUrl ? (
        <audio ref={backgroundMusicRef} src={test.backgroundMusicUrl} loop preload="auto" />
      ) : null}
      {content}
    </div>
  );
}
