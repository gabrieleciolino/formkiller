"use server";

import { PUBLIC_FORM_TURNSTILE_ACTION } from "@/features/forms/constants";
import { formLanguageSchema, turnstileTokenSchema } from "@/features/forms/schema";
import { createLeadSchema } from "@/features/leads/schema";
import { generateCompletionAnalysis } from "@/lib/ai/functions";
import { generateTTS } from "@/lib/elevenlabs/functions";
import { uploadFile } from "@/lib/r2/functions";
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
import { tasks } from "@trigger.dev/sdk/v3";
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

async function getQuestionOrThrow(questionId: string) {
  const { data: question, error } = await supabaseAdmin
    .from("question")
    .select("id, form_id")
    .eq("id", questionId)
    .maybeSingle();

  if (error) throw error;
  if (!question) throw new Error("Question not found");

  return question;
}

export const startFormSessionAction = publicViewerClient
  .inputSchema(
    z.object({
      assignmentId: z.string().uuid(),
      turnstileToken: turnstileTokenSchema,
    }),
  )
  .action(async ({ parsedInput }) => {
    await verifyTurnstileToken({
      token: parsedInput.turnstileToken,
      expectedAction: PUBLIC_FORM_TURNSTILE_ACTION,
    });

    const assignment = await getFormAssignmentOrThrow(parsedInput.assignmentId);
    const formId = assignment.form_id;
    const userId = assignment.user_id;

    const { data, error } = await supabaseAdmin
      .from("form_session")
      .insert({
        form_id: formId,
        user_id: userId,
        status: "in_progress",
        current_question_index: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  });

export const submitAnswerAction = publicViewerClient
  .inputSchema(
    z.object({
      sessionId: z.string().uuid(),
      questionId: z.string().uuid(),
      formId: z.string().uuid(),
      language: formLanguageSchema,
      defaultAnswer: z.string().optional(),
      audioBase64: z.string().optional(),
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
      audioBase64,
      audioMimeType,
    } = parsedInput;

    const session = await getFormSessionOrThrow(sessionId);
    if (session.form_id !== formId) {
      throw new Error("Invalid session/form association");
    }
    if (session.status === "completed") {
      throw new Error("Session already completed");
    }

    const question = await getQuestionOrThrow(questionId);
    if (question.form_id !== formId) {
      throw new Error("Invalid question/form association");
    }

    let fileKey: string | undefined;
    let resolvedAudioMimeType: string | undefined;

    if (audioBase64) {
      const buffer = Buffer.from(audioBase64, "base64");
      const mimeType = audioMimeType ?? "audio/webm";
      const key = `stt/${formId}/${sessionId}/${Date.now()}.webm`;

      await uploadFile({ key, body: buffer, contentType: mimeType });
      fileKey = key;
      resolvedAudioMimeType = mimeType;
    }

    const { data: insertedAnswer } = await supabaseAdmin
      .from("answer")
      .insert({
        form_session_id: session.id,
        question_id: question.id,
        form_id: session.form_id,
        user_id: session.user_id,
        stt: null,
        file_key: fileKey ?? null,
        file_generated_at: fileKey ? new Date().toISOString() : null,
        ...(defaultAnswer ? { default_answer: defaultAnswer } : {}),
      } as never)
      .select("id")
      .single()
      .throwOnError();

    if (fileKey) {
      try {
        await tasks.trigger("form-answer-stt", {
          answerId: insertedAnswer.id,
          fileKey,
          language,
          audioMimeType: resolvedAudioMimeType,
        });
      } catch (enqueueError) {
        console.log("[enqueue_answer_stt_failed]", {
          answerId: insertedAnswer.id,
          formId,
          sessionId,
          message:
            enqueueError instanceof Error
              ? enqueueError.message
              : String(enqueueError),
        });
      }
    }

    const { count, error: questionsCountError } = await supabaseAdmin
      .from("question")
      .select("id", { count: "exact", head: true })
      .eq("form_id", formId);

    if (questionsCountError) throw questionsCountError;
    if (!count || count <= 0) throw new Error("Form has no questions");

    const nextQuestionIndex = (session.current_question_index ?? 0) + 1;
    const isLast = nextQuestionIndex >= count;

    await supabaseAdmin
      .from("form_session")
      .update({
        current_question_index: nextQuestionIndex,
        status: isLast ? "completed" : "in_progress",
      })
      .eq("id", session.id)
      .throwOnError();

    return { completed: isLast };
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
