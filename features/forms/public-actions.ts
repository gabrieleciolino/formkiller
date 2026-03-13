"use server";

import { PUBLIC_FORM_TURNSTILE_ACTION } from "@/features/forms/constants";
import { formLanguageSchema, turnstileTokenSchema } from "@/features/forms/schema";
import { createLeadSchema } from "@/features/leads/schema";
import { formAnswerSttTask } from "@/trigger/form-answer-stt";
import { generateCompletionAnalysis } from "@/lib/ai/functions";
import { generateTTS } from "@/lib/elevenlabs/functions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  TurnstileVerificationError,
  verifyTurnstileToken,
} from "@/lib/turnstile/functions";
import { setZodLocale } from "@/lib/zod/locale";
import {
  DEFAULT_SERVER_ERROR_MESSAGE,
  createSafeActionClient,
} from "next-safe-action";
import { cookies } from "next/headers";
import { z } from "zod";

const publicViewerClient = createSafeActionClient({
  handleServerError(error) {
    if (error instanceof TurnstileVerificationError) {
      return "TURNSTILE_FAILED";
    }

    console.log("[public_viewer_error]", {
      name: error.name,
      message: error.message,
    });
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
}).use(async ({ next }) => {
  const store = await cookies();
  setZodLocale(store.get("locale")?.value ?? "en");

  return next();
});

const submitAnswerRpcResultSchema = z.object({
  answerId: z.string().uuid(),
  completed: z.boolean(),
});

type SubmitAnswerRpcResult = z.infer<typeof submitAnswerRpcResultSchema>;

async function submitPublicFormAnswerRpc({
  sessionId,
  questionId,
  formId,
  defaultAnswer,
  fileKey,
  fileGeneratedAt,
}: {
  sessionId: string;
  questionId: string;
  formId: string;
  defaultAnswer?: string;
  fileKey?: string;
  fileGeneratedAt?: string;
}): Promise<SubmitAnswerRpcResult> {
  const rpcClient = supabaseAdmin as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };

  const { data, error } = await rpcClient.rpc("submit_public_form_answer", {
    p_session_id: sessionId,
    p_question_id: questionId,
    p_form_id: formId,
    p_default_answer: defaultAnswer ?? null,
    p_file_key: fileKey ?? null,
    p_file_generated_at: fileGeneratedAt ?? null,
    p_stt: null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return submitAnswerRpcResultSchema.parse(data);
}

async function getFormAssignmentOrThrow(assignmentId: string) {
  const { data: assignment, error } = await supabaseAdmin
    .from("form_assignment")
    .select("id, form_id, user_id, active")
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) throw error;
  if (!assignment) throw new Error("Form assignment not found");
  if (!assignment.active) throw new Error("Form assignment is not active");

  return assignment;
}

async function getFormSessionOrThrow(sessionId: string) {
  const { data: session, error } = await supabaseAdmin
    .from("form_session")
    .select("id, form_id, user_id, status, current_question_index")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw error;
  if (!session) throw new Error("Form session not found");

  return session;
}

export const startFormSessionAction = publicViewerClient
  .inputSchema(
    z.object({
      assignmentId: z.string().uuid(),
      turnstileToken: turnstileTokenSchema,
    }),
  )
  .action(async ({ parsedInput }) => {
    const actionStartAt = Date.now();

    const turnstileVerifyStartAt = Date.now();
    await verifyTurnstileToken({
      token: parsedInput.turnstileToken,
      expectedAction: PUBLIC_FORM_TURNSTILE_ACTION,
    });
    const turnstileVerifyMs = Date.now() - turnstileVerifyStartAt;

    const assignmentLookupStartAt = Date.now();
    const assignment = await getFormAssignmentOrThrow(parsedInput.assignmentId);
    const assignmentLookupMs = Date.now() - assignmentLookupStartAt;
    const formId = assignment.form_id;
    const userId = assignment.user_id;

    const insertSessionStartAt = Date.now();
    const { data, error } = await supabaseAdmin
      .from("form_session")
      .insert({
        form_id: formId,
        user_id: userId,
        status: "in_progress",
        current_question_index: 0,
      })
      .select("id")
      .single();
    const insertSessionMs = Date.now() - insertSessionStartAt;

    if (error) throw error;

    const totalMs = Date.now() - actionStartAt;
    const timings = {
      totalMs,
      turnstileVerifyMs,
      assignmentLookupMs,
      insertSessionMs,
    };

    console.log("[public_viewer_start_session_timing]", timings);

    return {
      id: data.id,
      timings,
    };
  });

export const submitAnswerAction = publicViewerClient
  .inputSchema(
    z.object({
      sessionId: z.string().uuid(),
      questionId: z.string().uuid(),
      formId: z.string().uuid(),
      language: formLanguageSchema,
      defaultAnswer: z.string().optional(),
      audioFileKey: z.string().optional(),
      audioMimeType: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const {
      sessionId,
      questionId,
      formId,
      language,
      defaultAnswer,
      audioFileKey,
      audioMimeType,
    } = parsedInput;

    const fileKey = audioFileKey?.trim() ? audioFileKey : undefined;
    const resolvedAudioMimeType = audioMimeType?.trim() ? audioMimeType : undefined;
    const fileGeneratedAt = fileKey ? new Date().toISOString() : undefined;

    const submitResult = await submitPublicFormAnswerRpc({
      sessionId,
      questionId,
      formId,
      defaultAnswer,
      fileKey,
      fileGeneratedAt,
    });

    if (fileKey) {
      try {
        await formAnswerSttTask.trigger({
          answerId: submitResult.answerId,
          fileKey,
          language,
          audioMimeType: resolvedAudioMimeType,
        });
      } catch (enqueueError) {
        console.log("[enqueue_answer_stt_failed]", {
          answerId: submitResult.answerId,
          formId,
          sessionId,
          message:
            enqueueError instanceof Error
              ? enqueueError.message
              : String(enqueueError),
        });
      }
    }

    return { completed: submitResult.completed };
  });

export const createLeadAction = publicViewerClient
  .inputSchema(
    createLeadSchema.extend({
      turnstileToken: turnstileTokenSchema,
    }),
  )
  .action(async ({ parsedInput }) => {
    const { sessionId, formId, name, email, phone, turnstileToken } =
      parsedInput;

    await verifyTurnstileToken({
      token: turnstileToken,
      expectedAction: PUBLIC_FORM_TURNSTILE_ACTION,
    });

    const session = await getFormSessionOrThrow(sessionId);
    if (session.form_id !== formId) {
      throw new Error("Invalid session/form association");
    }

    if (session.status !== "completed") {
      throw new Error("Session not completed");
    }

    const { data, error } = await supabaseAdmin
      .from("lead")
      .insert({
        form_session_id: session.id,
        form_id: session.form_id,
        user_id: session.user_id,
        name,
        email,
        phone,
      })
      .select()
      .single();

    if (error) throw error;

    const { data: form } = await supabaseAdmin
      .from("form")
      .select("name, language, analysis_instructions")
      .eq("id", formId)
      .single()
      .throwOnError();

    let analysisText: string | null = null;
    let analysisAudioUrl: string | null = null;
    const analysisInstructions = form.analysis_instructions?.trim();

    if (analysisInstructions) {
      try {
        const { data: answers } = await supabaseAdmin
          .from("answer")
          .select("default_answer, stt, question:question(question, order)")
          .eq("form_session_id", session.id)
          .order("order", { referencedTable: "question", ascending: true })
          .throwOnError();

        const normalizedAnswers = (answers ?? []).map((answer, index) => {
          const rawQuestion = answer.question as
            | { question: string; order: number }
            | { question: string; order: number }[]
            | null;
          const resolvedQuestion = Array.isArray(rawQuestion)
            ? rawQuestion[0]
            : rawQuestion;

          return {
            order: resolvedQuestion?.order ?? index,
            question: resolvedQuestion?.question ?? `Question ${index + 1}`,
            response: (answer.stt ?? answer.default_answer ?? "").trim(),
          };
        });

        if (normalizedAnswers.length > 0) {
          analysisText = await generateCompletionAnalysis({
            language: form.language,
            formName: form.name,
            analysisInstructions,
            lead: { name, email, phone },
            answers: normalizedAnswers,
          });

          if (analysisText.trim()) {
            const { url } = await generateTTS({
              text: analysisText,
              formId,
              language: form.language,
            });
            analysisAudioUrl = url;
          }
        }
      } catch (analysisError) {
        console.log("[lead_analysis_error]", {
          sessionId,
          formId,
          message:
            analysisError instanceof Error
              ? analysisError.message
              : String(analysisError),
        });
      }
    }

    return {
      ...data,
      analysisText,
      analysisAudioUrl,
    };
  });
