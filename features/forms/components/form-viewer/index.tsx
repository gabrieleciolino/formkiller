"use client";

import { blobToBase64 } from "@/features/forms/components/form-viewer/blob-to-base64";
import { CompletedPhase } from "@/features/forms/components/form-viewer/completed-phase";
import { LeadForm } from "@/features/forms/components/form-viewer/lead-form";
import { QuestionPhase } from "@/features/forms/components/form-viewer/question-phase";
import { getFormViewerThemeTokens } from "@/features/forms/components/form-viewer/theme-tokens";
import { useTypewriter } from "@/features/forms/components/form-viewer/use-typewriter";
import { WelcomePhase } from "@/features/forms/components/form-viewer/welcome-phase";
import {
  type FormViewerAnswerState,
  type FormViewerBackgroundStyle,
  type FormViewerPhase,
  type FormViewerProps,
  type FormViewerRecordState,
} from "@/features/forms/types";
import {
  startFormSessionAction,
  submitAnswerAction,
} from "@/features/forms/public-actions";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

export default function FormViewer({ form }: FormViewerProps) {
  const [phase, setPhase] = useState<FormViewerPhase>("welcome");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState<FormViewerAnswerState>(null);
  const [recordState, setRecordState] = useState<FormViewerRecordState>("idle");
  const [autoStopped, setAutoStopped] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const t = useTranslations();

  const questions = form.questions;
  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const showDefaultAnswers = form.type !== "voice-only";
  const showRecording = form.type !== "default-only";
  const isDark = form.theme !== "light";
  const tk = getFormViewerThemeTokens(isDark);
  const hasBackgroundImage = Boolean(form.backgroundImageUrl);
  const hasBackgroundMusic = Boolean(form.backgroundMusicUrl);
  const displayedText = useTypewriter(
    phase === "question" ? (currentQuestion?.question ?? "") : "",
  );

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
        });

        if (serverError || !data) throw new Error();

        setSessionId(data.id);
        setPhase("question");

        if (hasBackgroundMusic && bgMusicRef.current) {
          bgMusicRef.current.volume = 0.15;
          bgMusicRef.current.play().catch(() => {});
        }
      } catch {
        toast(t("viewer.errors.cannotStart"));
      }
    });
  };

  const toggleMute = () => {
    if (!bgMusicRef.current) return;

    bgMusicRef.current.muted = !bgMusicRef.current.muted;
    setIsMuted((isCurrentlyMuted) => !isCurrentlyMuted);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAnswer({ type: "custom", blob });
        setRecordState("done");
        stream.getTracks().forEach((track) => track.stop());
        bgMusicRef.current?.play().catch(() => {});
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setAutoStopped(false);
      setRecordState("recording");
      setAnswer(null);
      bgMusicRef.current?.pause();
    } catch {
      toast(t("viewer.errors.micAccess"));
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
    if (!answer || !sessionId || !currentQuestion) return;

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
          defaultAnswer: answer.type === "default" ? answer.text : undefined,
          audioBase64,
          audioMimeType,
        });

        if (serverError || !data) throw new Error();

        if (data.completed) {
          setPhase("lead-form");
          return;
        }

        setCurrentIndex((index) => index + 1);
        setAnswer(null);
        setRecordState("idle");
        setAutoStopped(false);
      } catch {
        toast(t("viewer.errors.saveAnswer"));
      }
    });
  };

  const bgStyle: FormViewerBackgroundStyle = hasBackgroundImage
    ? {
        backgroundImage: `url(${form.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  const bgAudio = hasBackgroundMusic ? (
    <audio
      ref={bgMusicRef}
      src={form.backgroundMusicUrl ?? undefined}
      loop
      preload="auto"
      className="hidden"
    />
  ) : null;

  if (phase === "welcome") {
    return (
      <WelcomePhase
        bgAudio={bgAudio}
        bgStyle={bgStyle}
        formName={form.name}
        hasBackgroundImage={hasBackgroundImage}
        isPending={isPending}
        onStart={handleStart}
        questionsCount={questions.length}
        tk={tk}
      />
    );
  }

  if (phase === "lead-form") {
    return (
      <LeadForm
        sessionId={sessionId!}
        formId={form.id}
        onCompleted={() => setPhase("completed")}
      />
    );
  }

  if (phase === "completed") {
    return (
      <CompletedPhase
        bgStyle={bgStyle}
        hasBackgroundImage={hasBackgroundImage}
        isDark={isDark}
        tk={tk}
      />
    );
  }

  return (
    <QuestionPhase
      answer={answer}
      autoStopped={autoStopped}
      bgAudio={bgAudio}
      bgStyle={bgStyle}
      currentIndex={currentIndex}
      displayedText={displayedText}
      hasBackgroundImage={hasBackgroundImage}
      hasBackgroundMusic={hasBackgroundMusic}
      isLast={isLast}
      isMuted={isMuted}
      isPending={isPending}
      onAdvance={handleAdvance}
      onResetRecording={resetRecording}
      onSelectDefault={handleSelectDefault}
      onStartRecording={startRecording}
      onStopRecording={stopRecording}
      onToggleMute={toggleMute}
      questions={questions}
      recordState={recordState}
      showDefaultAnswers={showDefaultAnswers}
      showRecording={showRecording}
      tk={tk}
    />
  );
}
