"use client";

import { isLikelyInAppBrowser } from "@/features/forms/components/form-viewer/browser-utils";
import { CompletedPhase } from "@/features/forms/components/form-viewer/completed-phase";
import { QuestionPhase } from "@/features/forms/components/form-viewer/question-phase";
import { getFormViewerThemeTokens } from "@/features/forms/components/form-viewer/theme-tokens";
import { useInvisibleTurnstile } from "@/features/forms/components/form-viewer/use-invisible-turnstile";
import { useTypewriter } from "@/features/forms/components/form-viewer/use-typewriter";
import { WelcomePhase } from "@/features/forms/components/form-viewer/welcome-phase";
import { PUBLIC_FORM_TURNSTILE_ACTION } from "@/features/forms/constants";
import {
  type FormViewerAnswerState,
  type FormViewerBackgroundStyle,
  type FormViewerCompletionPayload,
  type FormViewerPhase,
  type FormViewerProps,
  type FormViewerRecordState,
} from "@/features/forms/types";
import {
  getCompletionAnalysisAction,
  startFormSessionAction,
  submitAnswerAction,
} from "@/features/forms/public-actions";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

const LeadForm = dynamic(
  () =>
    import("@/features/forms/components/form-viewer/lead-form").then(
      (mod) => mod.LeadForm,
    ),
  {
    loading: () => null,
  },
);

function getAudioFileExtension(mimeType: string) {
  const subtype = mimeType.split("/")[1]?.trim().toLowerCase();
  if (!subtype) return "webm";
  if (subtype.includes("mp4")) return "m4a";
  if (subtype.includes("mpeg")) return "mp3";
  if (subtype.includes("ogg")) return "ogg";
  if (subtype.includes("wav")) return "wav";
  if (subtype.includes("webm")) return "webm";
  return "webm";
}

function roundMs(value: number) {
  return Math.round(value * 10) / 10;
}

export default function FormViewer({ form }: FormViewerProps) {
  const [phase, setPhase] = useState<FormViewerPhase>("welcome");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState<FormViewerAnswerState>(null);
  const [recordState, setRecordState] = useState<FormViewerRecordState>("idle");
  const [completionPayload, setCompletionPayload] =
    useState<FormViewerCompletionPayload>({
      analysisText: null,
      analysisAudioUrl: null,
      analysisStatus: "idle",
    });
  const [autoStopped, setAutoStopped] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const prefetchedTurnstileTokenRef = useRef<string | null>(null);
  const prefetchTurnstileTokenPromiseRef = useRef<Promise<string | null> | null>(
    null,
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const {
    containerRef: turnstileContainerRef,
    getToken: getTurnstileToken,
    isConfigured: isTurnstileConfigured,
  } = useInvisibleTurnstile({
    action: PUBLIC_FORM_TURNSTILE_ACTION,
  });
  const t = useTranslations();
  const isInAppBrowser = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return isLikelyInAppBrowser(navigator.userAgent);
  }, []);
  const showSecurityCheckError = useCallback(() => {
    toast(
      t(
        isInAppBrowser
          ? "viewer.errors.securityCheckInAppBrowser"
          : "viewer.errors.securityCheck",
      ),
    );
  }, [isInAppBrowser, t]);

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

  const primeTurnstileToken = useCallback(() => {
    if (prefetchedTurnstileTokenRef.current || prefetchTurnstileTokenPromiseRef.current) {
      return;
    }

    prefetchTurnstileTokenPromiseRef.current = getTurnstileToken()
      .then((token) => {
        prefetchedTurnstileTokenRef.current = token;
        return token;
      })
      .catch(() => null)
      .finally(() => {
        prefetchTurnstileTokenPromiseRef.current = null;
      });
  }, [getTurnstileToken]);

  useEffect(() => {
    if (phase !== "welcome" || !isTurnstileConfigured) return;
    primeTurnstileToken();
  }, [isTurnstileConfigured, phase, primeTurnstileToken]);

  const getStartTurnstileToken = useCallback(async () => {
    if (prefetchedTurnstileTokenRef.current) {
      const token = prefetchedTurnstileTokenRef.current;
      prefetchedTurnstileTokenRef.current = null;
      return token;
    }

    if (prefetchTurnstileTokenPromiseRef.current) {
      const token = await prefetchTurnstileTokenPromiseRef.current;
      if (token) {
        prefetchedTurnstileTokenRef.current = null;
        return token;
      }
    }

    return getTurnstileToken().catch(() => null);
  }, [getTurnstileToken]);

  const handleStart = () => {
    startTransition(async () => {
      const flowStartAt = performance.now();
      let getTokenMs = 0;
      let startActionMs = 0;
      let retriedAfterTurnstileFailure = false;
      let enteredQuestionPhase = false;
      const rollbackToWelcome = () => {
        if (!enteredQuestionPhase) return;
        enteredQuestionPhase = false;
        setPhase("welcome");
        setSessionId(null);
        setCurrentIndex(0);
        setAnswer(null);
        setRecordState("idle");
        setAutoStopped(false);
      };

      try {
        if (!isTurnstileConfigured) {
          showSecurityCheckError();
          console.log("[viewer_start_timing]", {
            status: "failed",
            reason: "turnstile_not_configured",
            totalClientMs: roundMs(performance.now() - flowStartAt),
          });
          return;
        }

        if (hasBackgroundMusic && bgMusicRef.current) {
          bgMusicRef.current.volume = 0.15;
          void bgMusicRef.current.play().catch(() => {});
        }

        setCompletionPayload({
          analysisText: null,
          analysisAudioUrl: null,
          analysisStatus: "idle",
        });
        setPhase("question");
        enteredQuestionPhase = true;

        const tokenStartAt = performance.now();
        let turnstileToken = await getStartTurnstileToken();
        getTokenMs = performance.now() - tokenStartAt;
        if (!turnstileToken) {
          rollbackToWelcome();
          showSecurityCheckError();
          primeTurnstileToken();
          console.log("[viewer_start_timing]", {
            status: "failed",
            reason: "turnstile_token_missing",
            getTokenMs: roundMs(getTokenMs),
            totalClientMs: roundMs(performance.now() - flowStartAt),
          });
          return;
        }

        const actionStartAt = performance.now();
        let { data, serverError } = await startFormSessionAction({
          formUsername: form.username,
          formSlug: form.slug,
          turnstileToken,
        });
        startActionMs = performance.now() - actionStartAt;

        if (serverError === "TURNSTILE_FAILED") {
          retriedAfterTurnstileFailure = true;

          const retryTokenStartAt = performance.now();
          turnstileToken = await getTurnstileToken().catch(() => null);
          getTokenMs += performance.now() - retryTokenStartAt;

          if (!turnstileToken) {
            rollbackToWelcome();
            showSecurityCheckError();
            primeTurnstileToken();
            console.log("[viewer_start_timing]", {
              status: "failed",
              reason: "turnstile_retry_token_missing",
              retriedAfterTurnstileFailure,
              getTokenMs: roundMs(getTokenMs),
              startActionMs: roundMs(startActionMs),
              totalClientMs: roundMs(performance.now() - flowStartAt),
            });
            return;
          }

          const retryActionStartAt = performance.now();
          ({ data, serverError } = await startFormSessionAction({
            formUsername: form.username,
            formSlug: form.slug,
            turnstileToken,
          }));
          startActionMs += performance.now() - retryActionStartAt;
        }

        if (serverError === "TURNSTILE_FAILED") {
          rollbackToWelcome();
          showSecurityCheckError();
          primeTurnstileToken();
          console.log("[viewer_start_timing]", {
            status: "failed",
            reason: "turnstile_verification_failed",
            retriedAfterTurnstileFailure,
            getTokenMs: roundMs(getTokenMs),
            startActionMs: roundMs(startActionMs),
            totalClientMs: roundMs(performance.now() - flowStartAt),
          });
          return;
        }

        if (serverError || !data) {
          primeTurnstileToken();
          console.log("[viewer_start_timing]", {
            status: "failed",
            reason: "start_action_error",
            retriedAfterTurnstileFailure,
            getTokenMs: roundMs(getTokenMs),
            startActionMs: roundMs(startActionMs),
            totalClientMs: roundMs(performance.now() - flowStartAt),
          });
          throw new Error();
        }

        setSessionId(data.id);

        console.log("[viewer_start_timing]", {
          status: "ok",
          retriedAfterTurnstileFailure,
          getTokenMs: roundMs(getTokenMs),
          startActionMs: roundMs(startActionMs),
          totalClientMs: roundMs(performance.now() - flowStartAt),
          serverTimings: data.timings ?? null,
        });
      } catch {
        if (bgMusicRef.current) {
          bgMusicRef.current.pause();
          bgMusicRef.current.currentTime = 0;
        }

        rollbackToWelcome();

        primeTurnstileToken();
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
      const preferredMimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ] as const;
      const supportedMimeType = preferredMimeTypes.find((mimeType) =>
        MediaRecorder.isTypeSupported(mimeType),
      );
      const recorderOptions = supportedMimeType
        ? { mimeType: supportedMimeType, audioBitsPerSecond: 32_000 }
        : { audioBitsPerSecond: 32_000 };
      let recorder: MediaRecorder;

      try {
        recorder = new MediaRecorder(stream, recorderOptions);
      } catch {
        recorder = new MediaRecorder(stream);
      }

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = () => {
        const recordedMimeType = recorder.mimeType || supportedMimeType || "audio/webm";
        const blob = new Blob(chunks, { type: recordedMimeType });
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
        let audioFileKey: string | undefined;
        let audioMimeType: string | undefined;

        if (answer.type === "custom") {
          const formData = new FormData();
          const fileMimeType = answer.blob.type || "audio/webm";
          const fileExtension = getAudioFileExtension(fileMimeType);
          formData.append(
            "file",
            answer.blob,
            `answer-${Date.now()}.${fileExtension}`,
          );
          formData.append("formId", form.id);
          formData.append("sessionId", sessionId);
          formData.append("questionId", currentQuestion.id);

          const uploadResponse = await fetch("/api/form/audio-upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error("AUDIO_UPLOAD_FAILED");
          }

          const uploadPayload = (await uploadResponse.json()) as {
            fileKey?: string;
            mimeType?: string;
          };

          if (!uploadPayload.fileKey) {
            throw new Error("AUDIO_UPLOAD_MISSING_FILE_KEY");
          }

          audioFileKey = uploadPayload.fileKey;
          audioMimeType = uploadPayload.mimeType ?? answer.blob.type;
        }

        const { data, serverError } = await submitAnswerAction({
          sessionId,
          questionId: currentQuestion.id,
          formId: form.id,
          language: form.language,
          defaultAnswer: answer.type === "default" ? answer.text : undefined,
          audioFileKey,
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

  useEffect(() => {
    if (phase !== "completed" || !sessionId) return;
    if (completionPayload.analysisStatus !== "processing") return;

    let isActive = true;
    let timeoutId: number | null = null;

    const schedulePoll = (delayMs: number) => {
      timeoutId = window.setTimeout(() => {
        void pollAnalysis();
      }, delayMs);
    };

    const pollAnalysis = async () => {
      const { data, serverError } = await getCompletionAnalysisAction({
        sessionId,
        formId: form.id,
      });

      if (!isActive) return;

      if (serverError || !data) {
        schedulePoll(2_000);
        return;
      }

      setCompletionPayload((prev) => {
        if (
          prev.analysisStatus === data.analysisStatus &&
          prev.analysisText === data.analysisText &&
          prev.analysisAudioUrl === data.analysisAudioUrl
        ) {
          return prev;
        }

        return {
          analysisStatus: data.analysisStatus,
          analysisText: data.analysisText,
          analysisAudioUrl: data.analysisAudioUrl,
        };
      });

      if (data.analysisStatus === "processing") {
        schedulePoll(2_000);
      }
    };

    schedulePoll(1_200);

    return () => {
      isActive = false;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [completionPayload.analysisStatus, form.id, phase, sessionId]);

  const bgStyle: FormViewerBackgroundStyle = hasBackgroundImage
    ? {
        backgroundImage: `url(${form.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  const shouldRenderBackgroundMusic = hasBackgroundMusic;

  let phaseContent: ReactNode;

  if (phase === "welcome") {
    phaseContent = (
      <WelcomePhase
        bgStyle={bgStyle}
        formName={form.name}
        hasBackgroundImage={hasBackgroundImage}
        isDark={isDark}
        introMessage={form.introMessage}
        introTitle={form.introTitle}
        isPending={isPending}
        onStart={handleStart}
        questionsCount={questions.length}
        tk={tk}
      />
    );
  } else if (phase === "lead-form") {
    phaseContent = (
      <LeadForm
        sessionId={sessionId!}
        formId={form.id}
        bgStyle={bgStyle}
        hasBackgroundImage={hasBackgroundImage}
        overlayClassName={tk.overlay}
        isDark={isDark}
        getTurnstileToken={getTurnstileToken}
        onSubmitStart={() => {
          setCompletionPayload({
            analysisText: null,
            analysisAudioUrl: null,
            analysisStatus: "processing",
          });
          setPhase("completed");
        }}
        onSubmitError={() => {
          setCompletionPayload({
            analysisText: null,
            analysisAudioUrl: null,
            analysisStatus: "idle",
          });
          setPhase("lead-form");
        }}
        onCompleted={(payload) => {
          setCompletionPayload(payload);
          setPhase("completed");
        }}
      />
    );
  } else if (phase === "completed") {
    phaseContent = (
      <CompletedPhase
        bgStyle={bgStyle}
        endMessage={form.endMessage}
        endTitle={form.endTitle}
        analysisText={completionPayload.analysisText}
        analysisAudioUrl={completionPayload.analysisAudioUrl}
        analysisStatus={completionPayload.analysisStatus}
        isAnalyzing={completionPayload.analysisStatus === "processing"}
        hasBackgroundImage={hasBackgroundImage}
        isDark={isDark}
        tk={tk}
      />
    );
  } else {
    phaseContent = (
      <QuestionPhase
        answer={answer}
        autoStopped={autoStopped}
        bgStyle={bgStyle}
        currentIndex={currentIndex}
        displayedText={displayedText}
        hasBackgroundImage={hasBackgroundImage}
        hasBackgroundMusic={hasBackgroundMusic}
        isDark={isDark}
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

  return (
    <>
      {shouldRenderBackgroundMusic && (
        <audio
          ref={bgMusicRef}
          src={form.backgroundMusicUrl ?? undefined}
          loop
          preload="auto"
          className="hidden"
        />
      )}
      <div ref={turnstileContainerRef} className="hidden" aria-hidden />
      {phaseContent}
    </>
  );
}
