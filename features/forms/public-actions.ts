"use server";

import { createLeadSchema } from "@/features/leads/schema";
import { generateSTT } from "@/lib/deepgram/functions";
import { uploadFile } from "@/lib/r2/functions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  DEFAULT_SERVER_ERROR_MESSAGE,
  createSafeActionClient,
} from "next-safe-action";
import { z } from "zod";

const publicViewerClient = createSafeActionClient({
  handleServerError(error) {
    console.log("[public_viewer_error]", {
      name: error.name,
      message: error.message,
    });
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

export const startFormSessionAction = publicViewerClient
  .inputSchema(
    z.object({
      formId: z.string(),
      userId: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { formId, userId } = parsedInput;

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
      sessionId: z.string(),
      questionId: z.string(),
      formId: z.string(),
      userId: z.string(),
      questionIndex: z.number(),
      totalQuestions: z.number(),
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
      userId,
      questionIndex,
      totalQuestions,
      defaultAnswer,
      audioBase64,
      audioMimeType,
    } = parsedInput;

    let fileKey: string | undefined;
    let stt: string | undefined;

    if (audioBase64) {
      const buffer = Buffer.from(audioBase64, "base64");
      const mimeType = audioMimeType ?? "audio/webm";
      const key = `stt/${formId}/${sessionId}/${Date.now()}.webm`;

      await uploadFile({ key, body: buffer, contentType: mimeType });
      fileKey = key;
      stt = await generateSTT({ buffer, mimeType });
    }

    await supabaseAdmin
      .from("answer")
      .insert({
        form_session_id: sessionId,
        question_id: questionId,
        form_id: formId,
        user_id: userId,
        stt: stt ?? null,
        file_key: fileKey ?? null,
        file_generated_at: fileKey ? new Date().toISOString() : null,
        ...(defaultAnswer ? { default_answer: defaultAnswer } : {}),
      } as never);

    const isLast = questionIndex + 1 >= totalQuestions;

    await supabaseAdmin
      .from("form_session")
      .update({
        current_question_index: questionIndex + 1,
        status: isLast ? "completed" : "in_progress",
      })
      .eq("id", sessionId);

    return { completed: isLast };
  });

export const createLeadAction = publicViewerClient
  .inputSchema(createLeadSchema)
  .action(async ({ parsedInput }) => {
    const { sessionId, formId, userId, name, email, phone, notes } =
      parsedInput;

    const { data, error } = await supabaseAdmin
      .from("lead")
      .insert({
        form_session_id: sessionId,
        form_id: formId,
        user_id: userId,
        name,
        email,
        phone,
        notes: notes ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  });
