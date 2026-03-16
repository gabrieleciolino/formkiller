"use client";

import { Button } from "@/components/ui/button";
import {
  getTestAnalysisStatusAction,
  saveTestResultAction,
} from "@/features/tests/public-actions";
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
type AnalysisStatus = "idle" | "loading" | "ready" | "failed";

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

function ShareButtons({ profileTitle }: { profileTitle?: string }) {
  const url = typeof window === "undefined" ? "" : window.location.href;

  const shareText = profileTitle
    ? `Ho scoperto il mio profilo: "${profileTitle}"! Fai il test anche tu: ${url}`
    : `Ho appena completato il test! Fai il test anche tu: ${url}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const handleInstagram = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast("Link copiato!");
    }
  };

  return (
    <div className="space-y-2.5">
      <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Condividi il risultato
      </p>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-3 text-sm font-semibold text-foreground transition-colors hover:border-green-400 hover:bg-green-50 hover:text-green-700"
        >
          <svg viewBox="0 0 24 24" className="size-4 shrink-0 fill-current" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          WhatsApp
        </a>
        <button
          type="button"
          onClick={handleInstagram}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-3 text-sm font-semibold text-foreground transition-colors hover:border-pink-400 hover:bg-pink-50 hover:text-pink-700"
        >
          <svg viewBox="0 0 24 24" className="size-4 shrink-0 fill-current" aria-hidden>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
          Instagram
        </button>
      </div>
    </div>
  );
}

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
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [analysisRunId, setAnalysisRunId] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
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

  useEffect(() => {
    if (phase !== "completed" || test.resultType !== "analysis") {
      return;
    }

    if (!analysisRunId || analysisStatus !== "loading") {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let pollAttempts = 0;
    const maxPollAttempts = 200;
    const pollDelayMs = 1500;

    const scheduleNextPoll = () => {
      timeoutId = setTimeout(() => {
        void poll();
      }, pollDelayMs);
    };

    const poll = async () => {
      pollAttempts += 1;
      if (pollAttempts > maxPollAttempts) {
        setAnalysisStatus("failed");
        return;
      }

      try {
        const { data, serverError } = await getTestAnalysisStatusAction({
          runId: analysisRunId,
        });

        if (cancelled) {
          return;
        }

        if (serverError || !data) {
          scheduleNextPoll();
          return;
        }

        if (data.status === "processing") {
          scheduleNextPoll();
          return;
        }

        const nextAnalysis = data.analysisText?.trim() || null;
        setAnalysisText(nextAnalysis);
        setAnalysisStatus(nextAnalysis ? "ready" : "failed");
      } catch {
        if (!cancelled) {
          scheduleNextPoll();
        }
      }
    };

    scheduleNextPoll();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [analysisRunId, analysisStatus, phase, test.resultType]);

  const handleStart = () => {
    setCurrentIndex(0);
    setScoreTotals([0, 0, 0, 0]);
    setAnswerSelections([]);
    setSelectedAnswerOrder(null);
    setWinnerProfileIndex(null);
    setAnalysisText(null);
    setAnalysisRunId(null);
    setAnalysisStatus("idle");
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
      setAnalysisText(null);
      setAnalysisRunId(null);
      setAnalysisStatus(test.resultType === "analysis" ? "loading" : "idle");

      if (!winnerProfileId) return;

      startTransition(async () => {
        try {
          const { data, serverError } = await saveTestResultAction({
            testId: test.id,
            profileId: winnerProfileId,
            language: test.language,
            scoreTotals: nextTotals,
            answerSelections: nextSelections,
          });
          if (serverError) throw new Error();

          if (test.resultType === "analysis") {
            const nextRunId = data?.analysisRunId?.trim() || null;

            setAnalysisText(null);
            setAnalysisRunId(nextRunId);

            if (data?.analysisStatus === "processing" && nextRunId) {
              setAnalysisStatus("loading");
            } else {
              setAnalysisStatus("failed");
            }
          }
        } catch {
          if (test.resultType === "analysis") {
            setAnalysisStatus("failed");
          }
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

          {test.resultType === "profile" && winnerProfile ? (
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

          {test.resultType === "analysis" ? (
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  {t("testViewer.completed.analysisTitle")}
                </p>
              </div>
              {analysisStatus === "loading" ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("testViewer.completed.analysisLoading")}
                </p>
              ) : analysisText ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {analysisText}
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("testViewer.completed.analysisErrorFallback")}
                </p>
              )}
            </div>
          ) : null}

          <ShareButtons
            profileTitle={
              test.resultType === "profile" ? winnerProfile?.title : undefined
            }
          />

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
