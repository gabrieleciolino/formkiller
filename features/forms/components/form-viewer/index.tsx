"use client";

import {
  startFormSessionAction,
  submitAnswerAction,
} from "@/features/forms/public-actions";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  MicIcon,
  StopCircleIcon,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
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
  questions: ViewerQuestion[];
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
  }, [text]);

  return displayed;
}

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

type AnswerState =
  | { type: "default"; text: string }
  | { type: "custom"; blob: Blob }
  | null;

type RecordState = "idle" | "recording" | "done";
type Phase = "welcome" | "question" | "completed";

export default function FormViewer({ form }: { form: ViewerFormData }) {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState<AnswerState>(null);
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [isPending, startTransition] = useTransition();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const questions = form.questions;
  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const showDefaultAnswers = form.type !== "voice-only";
  const showRecording = form.type !== "default-only";
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
  }, [currentIndex, phase]);

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
      } catch {
        toast("Impossibile avviare il questionario.");
      }
    });
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
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordState("recording");
      setAnswer(null);
    } catch {
      toast("Impossibile accedere al microfono.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  };

  const resetRecording = () => {
    setRecordState("idle");
    setAnswer(null);
  };

  const handleSelectDefault = (text: string) => {
    if (recordState === "recording") {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current = null;
    }
    setRecordState("idle");
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
          userId: form.userId,
          questionIndex: currentIndex,
          totalQuestions: questions.length,
          defaultAnswer: answer.type === "default" ? answer.text : undefined,
          audioBase64,
          audioMimeType,
        });

        if (serverError || !data) throw new Error();

        if (data.completed) {
          setPhase("completed");
        } else {
          setCurrentIndex((i) => i + 1);
          setAnswer(null);
          setRecordState("idle");
        }
      } catch {
        toast("Errore durante il salvataggio della risposta.");
      }
    });
  };

  if (phase === "welcome") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-black p-6 text-white">
        <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
          <p className="text-xs tracking-widest text-white/30 uppercase">
            {form.name}
          </p>
          <h1 className="text-5xl font-black tracking-tight">Benvenuto</h1>
          <p className="text-sm leading-relaxed text-white/40">
            Ti verranno poste {questions.length} domande.
            <br />
            Rispondi scegliendo una risposta o registrando la tua voce.
          </p>
          <button
            onClick={handleStart}
            disabled={isPending}
            className="mt-2 flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {isPending ? "Caricamento..." : "Comincia"}
            {!isPending && <ChevronRightIcon className="size-4" />}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "completed") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-black p-6 text-white">
        <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-white/10">
            <CheckCircleIcon className="size-10 text-white" />
          </div>
          <h1 className="text-4xl font-black">Grazie!</h1>
          <p className="text-sm text-white/40">
            Le tue risposte sono state registrate correttamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-black text-white">
      {/* Progress bar */}
      <div className="flex items-center justify-between px-6 pt-8 pb-2">
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-0.5 w-8 rounded-full transition-all duration-500 ${
                i < currentIndex
                  ? "bg-white"
                  : i === currentIndex
                    ? "bg-white/50"
                    : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <span className="text-xs tabular-nums text-white/30">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Question — subtitle style, vertically centered */}
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <p className="text-center text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
          {displayedText}
          <span className="ml-px inline-block h-6 w-0.5 animate-pulse bg-white/50 align-middle" />
        </p>
      </div>

      {/* Bottom answers + controls */}
      <div className="space-y-3 px-4 pb-10">
        {/* Default answers grid */}
        {showDefaultAnswers && <div className="grid grid-cols-2 gap-2">
          {currentQuestion.defaultAnswers.map((da, i) => {
            const isSelected =
              answer?.type === "default" && answer.text === da.answer;
            return (
              <button
                key={i}
                onClick={() => handleSelectDefault(da.answer)}
                className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium leading-snug transition-all active:scale-95 ${
                  isSelected
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10"
                }`}
              >
                {da.answer}
              </button>
            );
          })}
        </div>}

        {/* Recording button */}
        {showRecording && <div className="flex justify-center py-1">
          {recordState === "idle" && (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/50 transition-all hover:border-white/20 hover:text-white/80 active:scale-95"
            >
              <MicIcon className="size-4" />
              Registra risposta
            </button>
          )}
          {recordState === "recording" && (
            <button
              onClick={stopRecording}
              className="flex animate-pulse items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm text-red-400"
            >
              <StopCircleIcon className="size-4" />
              Stop registrazione
            </button>
          )}
          {recordState === "done" && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-green-500/25 bg-green-500/10 px-4 py-2 text-sm text-green-400">
                <CheckCircleIcon className="size-4" />
                Risposta registrata
              </div>
              <button
                onClick={resetRecording}
                className="text-xs text-white/25 underline hover:text-white/50"
              >
                Re-registra
              </button>
            </div>
          )}
        </div>}

        {/* Advance button */}
        <button
          onClick={handleAdvance}
          disabled={!answer || isPending}
          className="w-full rounded-2xl bg-white py-4 text-sm font-semibold text-black transition-all active:scale-95 disabled:opacity-20 hover:opacity-90"
        >
          {isPending ? "..." : isLast ? "Concludi" : "Avanti →"}
        </button>
      </div>
    </div>
  );
}
