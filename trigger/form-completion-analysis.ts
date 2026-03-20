import {
  completionAnalysisStatusSchema,
  formLanguageSchema,
} from "@/features/forms/schema";
import { generateCompletionAnalysis } from "@/lib/ai/functions";
import { generateTTS } from "@/lib/elevenlabs/functions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger, task, wait } from "@trigger.dev/sdk/v3";
import { z } from "zod";

const formCompletionAnalysisPayloadSchema = z.object({
  sessionId: z.string().uuid(),
  formId: z.string().uuid(),
});

const ANALYSIS_STT_MAX_RETRIES = 3;
const ANALYSIS_STT_RETRY_SECONDS = 2;

type FormCompletionAnalysisPayload = z.infer<
  typeof formCompletionAnalysisPayloadSchema
>;

async function updateSessionAnalysisState({
  sessionId,
  status,
  text,
  audioUrl,
}: {
  sessionId: string;
  status: z.infer<typeof completionAnalysisStatusSchema>;
  text?: string | null;
  audioUrl?: string | null;
}) {
  await supabaseAdmin
    .from("form_session")
    .update({
      completion_analysis_status: status,
      completion_analysis_text: text ?? null,
      completion_analysis_audio_url: audioUrl ?? null,
    })
    .eq("id", sessionId)
    .throwOnError();
}

async function fetchAnswersWithRetries(sessionId: string) {
  for (let attempt = 0; attempt <= ANALYSIS_STT_MAX_RETRIES; attempt += 1) {
    const { data: answers } = await supabaseAdmin
      .from("answer")
      .select("default_answer, stt, file_key, question:question(question, order)")
      .eq("form_session_id", sessionId)
      .order("order", { referencedTable: "question", ascending: true })
      .throwOnError();

    const unresolvedVoiceAnswers = (answers ?? []).some(
      (answer) => Boolean(answer.file_key) && !answer.stt?.trim(),
    );

    if (!unresolvedVoiceAnswers || attempt === ANALYSIS_STT_MAX_RETRIES) {
      return answers ?? [];
    }

    await wait.for({ seconds: ANALYSIS_STT_RETRY_SECONDS });
  }

  return [];
}

export const formCompletionAnalysisTask = task({
  id: "form-completion-analysis",
  run: async (payload: FormCompletionAnalysisPayload) => {
    const parsedPayload = formCompletionAnalysisPayloadSchema.parse(payload);
    const { sessionId, formId } = parsedPayload;

    logger.log("Starting background completion analysis", {
      sessionId,
      formId,
    });

    try {
      const { data: session } = await supabaseAdmin
        .from("form_session")
        .select("id, form_id, status")
        .eq("id", sessionId)
        .maybeSingle()
        .throwOnError();

      if (
        !session ||
        session.form_id !== formId ||
        (session.status !== "abandoned" && session.status !== "completed")
      ) {
        await updateSessionAnalysisState({
          sessionId,
          status: "failed",
          text: null,
          audioUrl: null,
        });

        logger.log("Skipping completion analysis due to invalid session state", {
          sessionId,
          formId,
          sessionFound: Boolean(session),
          sessionStatus: session?.status ?? null,
        });

        return {
          sessionId,
          formId,
          status: "failed" as const,
        };
      }

      const { data: form } = await supabaseAdmin
        .from("form")
        .select("name, language, analysis_instructions")
        .eq("id", formId)
        .single()
        .throwOnError();

      const analysisInstructions = form.analysis_instructions?.trim();

      if (!analysisInstructions) {
        await updateSessionAnalysisState({
          sessionId,
          status: "unavailable",
          text: null,
          audioUrl: null,
        });

        logger.log("Completion analysis unavailable: no analysis instructions", {
          sessionId,
          formId,
        });

        return {
          sessionId,
          formId,
          status: "unavailable" as const,
        };
      }

      const answers = await fetchAnswersWithRetries(sessionId);

      const normalizedAnswers = answers
        .map((answer, index) => {
          const rawQuestion = answer.question as
            | { question: string; order: number }
            | { question: string; order: number }[]
            | null;
          const resolvedQuestion = Array.isArray(rawQuestion)
            ? rawQuestion[0]
            : rawQuestion;
          const response = (answer.stt ?? answer.default_answer ?? "").trim();

          return {
            order: resolvedQuestion?.order ?? index,
            question: resolvedQuestion?.question ?? `Question ${index + 1}`,
            response,
          };
        })
        .filter((answer) => answer.response.length > 0);

      if (normalizedAnswers.length === 0) {
        await updateSessionAnalysisState({
          sessionId,
          status: "completed",
          text: null,
          audioUrl: null,
        });

        return {
          sessionId,
          formId,
          status: "completed" as const,
          hasText: false,
          hasAudio: false,
        };
      }

      const language = formLanguageSchema.parse(form.language);
      const analysisText = await generateCompletionAnalysis({
        language,
        formName: form.name,
        analysisInstructions,
        answers: normalizedAnswers,
      });

      const trimmedAnalysisText = analysisText.trim();
      let analysisAudioUrl: string | null = null;

      if (trimmedAnalysisText.length > 0) {
        try {
          const { url } = await generateTTS({
            text: trimmedAnalysisText,
            formId,
            language,
          });
          analysisAudioUrl = url;
        } catch (ttsError) {
          logger.log("Failed to generate completion analysis TTS", {
            sessionId,
            formId,
            message: ttsError instanceof Error ? ttsError.message : String(ttsError),
          });
        }
      }

      await updateSessionAnalysisState({
        sessionId,
        status: "completed",
        text: trimmedAnalysisText.length > 0 ? trimmedAnalysisText : null,
        audioUrl: analysisAudioUrl,
      });

      logger.log("Completed background completion analysis", {
        sessionId,
        formId,
        hasText: trimmedAnalysisText.length > 0,
        hasAudio: Boolean(analysisAudioUrl),
      });

      return {
        sessionId,
        formId,
        status: "completed" as const,
        hasText: trimmedAnalysisText.length > 0,
        hasAudio: Boolean(analysisAudioUrl),
      };
    } catch (analysisError) {
      await updateSessionAnalysisState({
        sessionId,
        status: "failed",
        text: null,
        audioUrl: null,
      }).catch(() => {});

      logger.log("Failed background completion analysis", {
        sessionId,
        formId,
        message:
          analysisError instanceof Error ? analysisError.message : String(analysisError),
      });

      return {
        sessionId,
        formId,
        status: "failed" as const,
      };
    }
  },
});
