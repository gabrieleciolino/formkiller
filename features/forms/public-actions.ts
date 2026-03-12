"use server";

import { formLanguageSchema } from "@/features/forms/schema";
import { createLeadSchema } from "@/features/leads/schema";
import { generateSTT } from "@/lib/deepgram/functions";
import { uploadFile } from "@/lib/r2/functions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { setZodLocale } from "@/lib/zod/locale";
import {
  DEFAULT_SERVER_ERROR_MESSAGE,
  createSafeActionClient,
} from "next-safe-action";
import { cookies } from "next/headers";
import { z } from "zod";

const publicViewerClient = createSafeActionClient({
  handleServerError(error) {
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
    }),
  )
  .action(async ({ parsedInput }) => {
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
    let stt: string | undefined;

    if (audioBase64) {
      const buffer = Buffer.from(audioBase64, "base64");
      const mimeType = audioMimeType ?? "audio/webm";
      const key = `stt/${formId}/${sessionId}/${Date.now()}.webm`;

      await uploadFile({ key, body: buffer, contentType: mimeType });
      fileKey = key;
      stt = await generateSTT({ buffer, mimeType, language });
    }

    await supabaseAdmin
      .from("answer")
      .insert({
        form_session_id: session.id,
        question_id: question.id,
        form_id: session.form_id,
        user_id: session.user_id,
        stt: stt ?? null,
        file_key: fileKey ?? null,
        file_generated_at: fileKey ? new Date().toISOString() : null,
        ...(defaultAnswer ? { default_answer: defaultAnswer } : {}),
      } as never)
      .throwOnError();

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
  .inputSchema(createLeadSchema)
  .action(async ({ parsedInput }) => {
    const { sessionId, formId, name, email, phone } = parsedInput;

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

    return data;
  });
