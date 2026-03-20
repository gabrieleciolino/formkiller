"use server";

import { canUseProFeatures } from "@/lib/account";
import { PUBLIC_FORM_TURNSTILE_ACTION } from "@/features/forms/constants";
import {
  completionAnalysisStatusSchema,
  formLanguageSchema,
  turnstileTokenSchema,
} from "@/features/forms/schema";
import { createLeadSchema } from "@/features/leads/schema";
import { formAnswerSttTask } from "@/trigger/form-answer-stt";
import { formCompletionAnalysisTask } from "@/trigger/form-completion-analysis";
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

const completionAnalysisResultSchema = z.object({
  analysisStatus: completionAnalysisStatusSchema,
  analysisText: z.string().nullable(),
  analysisAudioUrl: z.string().nullable(),
});

type CompletionAnalysisResult = z.infer<typeof completionAnalysisResultSchema>;

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

async function getPublishedFormByUsernameAndSlugOrThrow({
  username,
  slug,
}: {
  username: string;
  slug: string;
}) {
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedSlug = slug.trim();

  if (!normalizedUsername || !normalizedSlug) {
    throw new Error("Invalid public form path");
  }

  const { data: account, error: accountError } = await supabaseAdmin
    .from("account")
    .select("user_id, username")
    .eq("username", normalizedUsername)
    .maybeSingle();

  if (accountError) throw accountError;
  if (!account) throw new Error("Account not found");

  const { data: form, error } = await supabaseAdmin
    .from("form")
    .select("id, slug, user_id, is_published")
    .eq("user_id", account.user_id)
    .eq("slug", normalizedSlug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  if (!form) throw new Error("Published form not found");

  return form;
}

async function getAccountForUserOrThrow(userId: string) {
  const { data: account, error } = await supabaseAdmin
    .from("account")
    .select("role, tier")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!account) throw new Error("Account not found");

  return account;
}

async function getFormOwnerCapabilitiesOrThrow(formId: string) {
  const { data: form, error } = await supabaseAdmin
    .from("form")
    .select("user_id")
    .eq("id", formId)
    .maybeSingle();

  if (error) throw error;
  if (!form) throw new Error("Form not found");

  const account = await getAccountForUserOrThrow(form.user_id);
  const isProEnabled = canUseProFeatures({
    role: account.role,
    tier: account.tier ?? "free",
  });

  return {
    ownerUserId: form.user_id,
    isProEnabled,
  };
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

async function getSessionCompletionAnalysisOrThrow(
  sessionId: string,
): Promise<CompletionAnalysisResult> {
  const { data, error } = await supabaseAdmin
    .from("form_session")
    .select(
      "completion_analysis_status, completion_analysis_text, completion_analysis_audio_url",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Form session not found");

  return completionAnalysisResultSchema.parse({
    analysisStatus: data.completion_analysis_status,
    analysisText: data.completion_analysis_text,
    analysisAudioUrl: data.completion_analysis_audio_url,
  });
}

export const startFormSessionAction = publicViewerClient
  .inputSchema(
    z.object({
      formUsername: z.string().trim().min(1),
      formSlug: z.string().trim().min(1),
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

    const formLookupStartAt = Date.now();
    const form = await getPublishedFormByUsernameAndSlugOrThrow({
      username: parsedInput.formUsername,
      slug: parsedInput.formSlug,
    });
    const formLookupMs = Date.now() - formLookupStartAt;
    const formId = form.id;
    const userId = form.user_id;

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
      formLookupMs,
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

    const { isProEnabled } = await getFormOwnerCapabilitiesOrThrow(formId);

    if (fileKey) {
      if (!isProEnabled) {
        throw new Error("Voice answers are available only for pro forms");
      }

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

    if (submitResult.completed) {
      if (isProEnabled) {
        await supabaseAdmin
          .from("form_session")
          .update({
            status: "abandoned",
            completion_analysis_status: "processing",
            completion_analysis_text: null,
            completion_analysis_audio_url: null,
          })
          .eq("id", sessionId)
          .throwOnError();

        try {
          await formCompletionAnalysisTask.trigger({
            sessionId,
            formId,
          });
        } catch (enqueueError) {
          console.log("[enqueue_completion_analysis_failed]", {
            formId,
            sessionId,
            message:
              enqueueError instanceof Error
                ? enqueueError.message
                : String(enqueueError),
          });

          await supabaseAdmin
            .from("form_session")
            .update({
              status: "abandoned",
              completion_analysis_status: "failed",
              completion_analysis_text: null,
              completion_analysis_audio_url: null,
            })
            .eq("id", sessionId)
            .throwOnError();
        }
      } else {
        await supabaseAdmin
          .from("form_session")
          .update({
            status: "abandoned",
            completion_analysis_status: "unavailable",
            completion_analysis_text: null,
            completion_analysis_audio_url: null,
          })
          .eq("id", sessionId)
          .throwOnError();
      }
    }

    return { completed: submitResult.completed };
  });

export const getCompletionAnalysisAction = publicViewerClient
  .inputSchema(
    z.object({
      sessionId: z.string().uuid(),
      formId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { sessionId, formId } = parsedInput;
    const session = await getFormSessionOrThrow(sessionId);

    if (session.form_id !== formId) {
      throw new Error("Invalid session/form association");
    }

    return getSessionCompletionAnalysisOrThrow(sessionId);
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

    if (session.status !== "abandoned" && session.status !== "completed") {
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

    await supabaseAdmin
      .from("form_session")
      .update({
        status: "completed",
      })
      .eq("id", session.id)
      .throwOnError();

    const completionAnalysis = await getSessionCompletionAnalysisOrThrow(session.id);

    return {
      ...data,
      ...completionAnalysis,
    };
  });
