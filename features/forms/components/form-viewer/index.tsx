"use client";

import {
  createLeadAction,
  startFormSessionAction,
  submitAnswerAction,
} from "@/features/forms/public-actions";
import { MAX_RECORDING_SECONDS } from "@/features/forms/constants";
import { makeCreateLeadSchema, CreateLeadType } from "@/features/leads/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  MicIcon,
  StopCircleIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export type ViewerQuestion = {
  id: string;
  question: string;
  audioUrl: string | null;
  defaultAnswers: { answer: string; order: number }[];
};

export type ViewerFormData = {
  id: string;
  name: string;
  userId: string;
  type: "mixed" | "default-only" | "voice-only";
  language: string;
  theme: "light" | "dark";
  questions: ViewerQuestion[];
  backgroundImageUrl: string | null;
  backgroundMusicUrl: string | null;
};

function useTypewriter(text: string, speed = 25) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  return displayed;
}

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

// ── SVG circle timer constants ────────────────────────────────────────────────
const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function RecordingButton({ onStop }: { onStop: (wasAuto: boolean) => void }) {
  const [elapsed, setElapsed] = useState(0);
  const onStopRef = useRef(onStop);
  useEffect(() => {
    onStopRef.current = onStop;
  });

  useEffect(() => {
    const startTime = Date.now();
    const id = setInterval(() => {
      const e = Math.min(
        (Date.now() - startTime) / 1000,
        MAX_RECORDING_SECONDS,
      );
      setElapsed(e);
      if (e >= MAX_RECORDING_SECONDS) {
        clearInterval(id);
        onStopRef.current(true);
      }
    }, 50);
    return () => clearInterval(id);
  }, []);

  const dashoffset = CIRCUMFERENCE * (elapsed / MAX_RECORDING_SECONDS);

  return (
    <div className="relative size-14">
      <svg
        className="absolute inset-0 -rotate-90"
        viewBox="0 0 56 56"
        fill="none"
      >
        {/* Track */}
        <circle
          cx="28"
          cy="28"
          r={RADIUS}
          stroke="rgba(239,68,68,0.15)"
          strokeWidth="2"
        />
        {/* Countdown arc */}
        <circle
          cx="28"
          cy="28"
          r={RADIUS}
          stroke="rgba(239,68,68,0.7)"
          strokeWidth="2"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
        />
      </svg>
      <button
        onClick={() => onStopRef.current(false)}
        className="absolute inset-0 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 active:scale-95"
      >
        <StopCircleIcon className="size-5" />
      </button>
    </div>
  );
}

// ── LeadForm ──────────────────────────────────────────────────────────────────

function LeadForm({
  sessionId,
  formId,
  userId,
  onCompleted,
}: {
  sessionId: string;
  formId: string;
  userId: string;
  onCompleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("viewer.leadForm");
  const tv = useTranslations("validation");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateLeadType>({
    resolver: zodResolver(
      makeCreateLeadSchema({
        minLength2: tv("minLength2"),
        emailInvalid: tv("emailInvalid"),
        phoneInvalid: tv("phoneInvalid"),
      }),
    ),
    defaultValues: { sessionId, formId, userId },
  });

  const onSubmit = (values: CreateLeadType) => {
    startTransition(async () => {
      try {
        const { data, serverError } = await createLeadAction(values);
        if (serverError || !data) throw new Error();
        onCompleted();
      } catch {
        toast(t("error"));
      }
    });
  };

  const fields = [
    { key: "name" as const, label: t("name"), type: "text" },
    { key: "email" as const, label: t("email"), type: "email" },
    { key: "phone" as const, label: t("phone"), type: "tel" },
    { key: "notes" as const, label: t("notes"), type: "text" },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-black text-white">
      <div className="flex flex-1 flex-col justify-center px-6 py-10">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black">{t("title")}</h2>
            <p className="text-sm text-white/40">{t("subtitle")}</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {fields.map(({ key, label, type }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">
                  {label}
                </label>
                <input
                  {...register(key)}
                  type={type}
                  className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors focus:bg-white/8 ${
                    errors[key]
                      ? "border-red-500/50 focus:border-red-500/70"
                      : "border-white/10 focus:border-white/30"
                  }`}
                />
                {errors[key] && (
                  <p className="text-xs text-red-400">{errors[key]?.message}</p>
                )}
              </div>
            ))}
            <button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full rounded-2xl bg-white py-4 text-sm font-semibold text-black transition-opacity disabled:opacity-40 hover:opacity-90"
            >
              {isPending ? t("loading") : t("submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── FormViewer ────────────────────────────────────────────────────────────────

type AnswerState =
  | { type: "default"; text: string }
  | { type: "custom"; blob: Blob }
  | null;

type RecordState = "idle" | "recording" | "done";
type Phase = "welcome" | "question" | "lead-form" | "completed";

export default function FormViewer({ form }: { form: ViewerFormData }) {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState<AnswerState>(null);
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [autoStopped, setAutoStopped] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const tWelcome = useTranslations("viewer.welcome");
  const tQuestion = useTranslations("viewer.question");
  const tCompleted = useTranslations("viewer.completed");
  const tErrors = useTranslations("viewer.errors");

  const questions = form.questions;
  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const showDefaultAnswers = form.type !== "voice-only";
  const showRecording = form.type !== "default-only";

  const isDark = form.theme !== "light";
  const tk = isDark
    ? {
        bg: "bg-black",
        text: "text-white",
        textSecondary: "text-white/40",
        textHint: "text-white/30",
        border: "border-white/10",
        cardIdle:
          "border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10",
        cardSelected: "border-white bg-white text-black",
        cta: "bg-white text-black",
        ctaDisabled: "disabled:opacity-20",
        cursor: "animate-pulse bg-white/50",
        progressActive: "bg-white",
        progressCurrent: "bg-white/50",
        progressInactive: "bg-white/10",
        progressText: "text-white/30",
        muteBtn: "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white",
        overlay: "bg-black/60",
        recordIdle:
          "border-white/10 bg-white/5 text-white/50 hover:border-white/25 hover:bg-white/10 hover:text-white/80",
        recordHint: "text-white/30",
        reRecord: "text-white/25 hover:text-white/50",
      }
    : {
        bg: "bg-white",
        text: "text-black",
        textSecondary: "text-black/40",
        textHint: "text-black/30",
        border: "border-black/10",
        cardIdle:
          "border-black/10 bg-black/5 text-black/70 hover:border-black/25 hover:bg-black/10",
        cardSelected: "border-black bg-black text-white",
        cta: "bg-black text-white",
        ctaDisabled: "disabled:opacity-20",
        cursor: "animate-pulse bg-black/50",
        progressActive: "bg-black",
        progressCurrent: "bg-black/50",
        progressInactive: "bg-black/10",
        progressText: "text-black/30",
        muteBtn: "bg-black/10 text-black/60 hover:bg-black/20 hover:text-black",
        overlay: "bg-white/60",
        recordIdle:
          "border-black/10 bg-black/5 text-black/50 hover:border-black/25 hover:bg-black/10 hover:text-black/80",
        recordHint: "text-black/30",
        reRecord: "text-black/25 hover:text-black/50",
      };
  const displayedText = useTypewriter(
    phase === "question" ? currentQuestion.question : "",
  );

  // TTS autoplay on question change
  useEffect(() => {
    if (phase !== "question") return;
    audioRef.current?.pause();
    const url = currentQuestion?.audioUrl;
    if (!url) return;
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => {});
    return () => {
      audio.pause();
    };
  }, [currentIndex, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = () => {
    startTransition(async () => {
      try {
        const { data, serverError } = await startFormSessionAction({
          formId: form.id,
          userId: form.userId,
        });
        if (serverError || !data) throw new Error();
        setSessionId(data.id);
        setPhase("question");

        // Start background music on first user interaction
        if (form.backgroundMusicUrl && bgMusicRef.current) {
          bgMusicRef.current.volume = 0.15;
          bgMusicRef.current.play().catch(() => {});
        }
      } catch {
        toast(tErrors("cannotStart"));
      }
    });
  };

  const toggleMute = () => {
    if (!bgMusicRef.current) return;
    bgMusicRef.current.muted = !bgMusicRef.current.muted;
    setIsMuted((m) => !m);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAnswer({ type: "custom", blob });
        setRecordState("done");
        stream.getTracks().forEach((t) => t.stop());
        bgMusicRef.current?.play().catch(() => {});
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setAutoStopped(false);
      setRecordState("recording");
      setAnswer(null);
      bgMusicRef.current?.pause();
    } catch {
      toast(tErrors("micAccess"));
    }
  };

  const stopRecording = (wasAuto = false) => {
    setAutoStopped(wasAuto);
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  };

  const resetRecording = () => {
    setRecordState("idle");
    setAutoStopped(false);
    setAnswer(null);
  };

  const handleSelectDefault = (text: string) => {
    if (recordState === "recording") {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current = null;
    }
    setRecordState("idle");
    setAutoStopped(false);
    setAnswer({ type: "default", text });
  };

  const handleAdvance = () => {
    if (!answer || !sessionId) return;
    startTransition(async () => {
      try {
        let audioBase64: string | undefined;
        let audioMimeType: string | undefined;

        if (answer.type === "custom") {
          audioBase64 = await blobToBase64(answer.blob);
          audioMimeType = answer.blob.type;
        }

        const { data, serverError } = await submitAnswerAction({
          sessionId,
          questionId: currentQuestion.id,
          formId: form.id,
          language: form.language,
          userId: form.userId,
          questionIndex: currentIndex,
          totalQuestions: questions.length,
          defaultAnswer: answer.type === "default" ? answer.text : undefined,
          audioBase64,
          audioMimeType,
        });

        if (serverError || !data) throw new Error();

        if (data.completed) {
          setPhase("lead-form");
        } else {
          setCurrentIndex((i) => i + 1);
          setAnswer(null);
          setRecordState("idle");
          setAutoStopped(false);
        }
      } catch {
        toast(tErrors("saveAnswer"));
      }
    });
  };

  const bgStyle = form.backgroundImageUrl
    ? {
        backgroundImage: `url(${form.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  // Persistent audio element — rendered once for the lifetime of the component
  // so bgMusicRef stays valid across phase transitions
  const bgAudio = form.backgroundMusicUrl ? (
    <audio
      ref={bgMusicRef}
      src={form.backgroundMusicUrl}
      loop
      preload="auto"
      className="hidden"
    />
  ) : null;

  if (phase === "welcome") {
    return (
      <div
        className={`relative flex min-h-dvh flex-col items-center justify-center p-6 ${tk.bg} ${tk.text}`}
        style={bgStyle}
      >
        {bgAudio}
        {form.backgroundImageUrl && (
          <div className={`absolute inset-0 ${tk.overlay}`} />
        )}
        <div className="relative flex w-full max-w-md flex-col items-center gap-8 text-center">
          <p className={`text-xs tracking-widest uppercase ${tk.textHint}`}>
            {form.name}
          </p>
          <h1 className="text-5xl font-black tracking-tight">
            {tWelcome("title")}
          </h1>
          <p className={`text-sm leading-relaxed ${tk.textSecondary}`}>
            {tWelcome("questionsCount", { count: questions.length })}
            <br />
            {tWelcome("instructions")}
          </p>
          <button
            onClick={handleStart}
            disabled={isPending}
            className={`mt-2 flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 ${tk.cta}`}
          >
            {isPending ? tWelcome("loading") : tWelcome("start")}
            {!isPending && <ChevronRightIcon className="size-4" />}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "lead-form") {
    return (
      <LeadForm
        sessionId={sessionId!}
        formId={form.id}
        userId={form.userId}
        onCompleted={() => setPhase("completed")}
      />
    );
  }

  if (phase === "completed") {
    return (
      <div
        className={`relative flex min-h-dvh flex-col items-center justify-center p-6 ${tk.bg} ${tk.text}`}
        style={bgStyle}
      >
        {form.backgroundImageUrl && (
          <div className={`absolute inset-0 ${tk.overlay}`} />
        )}
        <div className="relative flex w-full max-w-md flex-col items-center gap-6 text-center">
          <div
            className={`flex size-20 items-center justify-center rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}
          >
            <CheckCircleIcon className="size-10" />
          </div>
          <h1 className="text-4xl font-black">{tCompleted("title")}</h1>
          <p className={`text-sm ${tk.textSecondary}`}>
            {tCompleted("message")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex min-h-dvh flex-col ${tk.bg} ${tk.text}`}
      style={bgStyle}
    >
      {bgAudio}
      {form.backgroundImageUrl && (
        <div className={`absolute inset-0 ${tk.overlay}`} />
      )}
      {/* Progress bar + mute button on the same row */}
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
        <span className={`shrink-0 whitespace-nowrap text-xs tabular-nums ${tk.progressText}`}>
          {currentIndex + 1} / {questions.length}
        </span>
        {form.backgroundMusicUrl && (
          <button
            onClick={toggleMute}
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

      {/* Question */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-10">
        <p className="text-center text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
          {displayedText}
          <span
            className={`ml-px inline-block h-6 w-0.5 align-middle ${tk.cursor}`}
          />
        </p>
      </div>

      {/* Bottom answers + controls */}
      <div className="relative space-y-3 px-4 pb-10">
        {/* Default answers grid */}
        {showDefaultAnswers && (
          <div className="grid grid-cols-2 gap-2">
            {currentQuestion.defaultAnswers.map((da, i) => {
              const isSelected =
                answer?.type === "default" && answer.text === da.answer;
              return (
                <button
                  key={i}
                  onClick={() => handleSelectDefault(da.answer)}
                  className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium leading-snug transition-all active:scale-95 ${
                    isSelected ? tk.cardSelected : tk.cardIdle
                  }`}
                >
                  {da.answer}
                </button>
              );
            })}
          </div>
        )}

        {/* Recording section */}
        {showRecording && (
          <div className="flex flex-col items-center gap-2 py-1">
            {recordState === "idle" && (
              <>
                <button
                  onClick={startRecording}
                  className={`flex size-14 items-center justify-center rounded-full border transition-all active:scale-95 ${tk.recordIdle}`}
                >
                  <MicIcon className="size-5" />
                </button>
                <p className={`text-center text-xs ${tk.recordHint}`}>
                  {tQuestion("recordHint")}
                </p>
              </>
            )}

            {recordState === "recording" && (
              <RecordingButton onStop={stopRecording} />
            )}

            {recordState === "done" && (
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-green-500/25 bg-green-500/10 px-4 py-2 text-sm text-green-400">
                    <CheckCircleIcon className="size-4" />
                    {tQuestion("recorded")}
                  </div>
                  <button
                    onClick={resetRecording}
                    className={`text-xs underline ${tk.reRecord}`}
                  >
                    {tQuestion("reRecord")}
                  </button>
                </div>
                {autoStopped && (
                  <p className="text-xs text-amber-400/70">
                    {tQuestion("recordAutoStopped")}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Advance button */}
        <button
          onClick={handleAdvance}
          disabled={!answer || isPending}
          className={`w-full rounded-2xl py-4 text-sm font-semibold transition-all active:scale-95 hover:opacity-90 ${tk.cta} ${tk.ctaDisabled}`}
        >
          {isPending ? "..." : isLast ? tQuestion("finish") : tQuestion("next")}
        </button>
      </div>
    </div>
  );
}
