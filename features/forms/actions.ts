"use server";

import {
  addQuestionSchema,
  createFormSchema,
  deleteFormSchema,
  deleteQuestionSchema,
  editFormSchema,
  editQuestionsSchema,
  type FormLanguage,
  generateQuestionTTSSchema,
  getElevenLabsVoicesSchema,
  regenerateFormQuestionsTTSSchema,
  saveAnalysisInstructionsSchema,
  updateFormVoiceSchema,
} from "@/features/forms/schema";
import { canUseProFeatures } from "@/lib/account";
import { authenticatedActionClient } from "@/lib/actions";
import {
  generateTTS,
  getDefaultElevenLabsVoiceId,
  getElevenLabsVoices,
} from "@/lib/elevenlabs/functions";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formCreateTask } from "@/trigger/form-create";
import { urls } from "@/lib/urls";
import { revalidatePath } from "next/cache";
import { runs } from "@trigger.dev/sdk/v3";
import { z } from "zod";

const getCreateFormStatusSchema = z.object({
  runId: z.string().trim().min(1),
});

const createFormStartResultSchema = z.object({
  status: z.enum(["processing", "completed"]),
  runId: z.string().trim().min(1).nullable(),
  formId: z.string().uuid().nullable(),
});

const createFormStatusResultSchema = z.object({
  status: z.enum(["processing", "completed", "failed"]),
  formId: z.string().uuid().nullable(),
});

const TERMINAL_FAILURE_STATUSES = new Set([
  "CANCELED",
  "FAILED",
  "CRASHED",
  "SYSTEM_FAILURE",
  "EXPIRED",
  "TIMED_OUT",
]);

const toNullableText = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const slugify = (value: string) => {
  const base = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 72);

  return base.length > 0 ? base : "form";
};

async function createUniqueFormSlug({
  supabase,
  source,
  excludeFormId,
}: {
  supabase: TypedSupabaseClient;
  source: string;
  excludeFormId?: string;
}) {
  const base = slugify(source);
  let slug = base;
  let suffix = 2;

  while (true) {
    const { data, error } = await supabase
      .from("form")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data || data.id === excludeFormId) {
      return slug;
    }

    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

function requireProFeatures(params: { userRole: "admin" | "user"; userTier: "free" | "pro" }) {
  if (!canUseProFeatures({ role: params.userRole, tier: params.userTier })) {
    throw new Error("Pro feature not available on your account");
  }
}

async function getUsernameByUserId(userId: string) {
  const { data: account, error } = await supabaseAdmin
    .from("account")
    .select("username")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return account?.username ?? null;
}

async function revalidateFormPaths({
  formId,
  formSlug,
  formUserId,
}: {
  formId: string;
  formSlug?: string | null;
  formUserId?: string | null;
}) {
  revalidatePath(urls.dashboard.forms.index);
  revalidatePath(urls.dashboard.forms.detail(formId));
  revalidatePath(urls.admin.forms.index);
  revalidatePath(urls.admin.forms.detail(formId));
  if (formSlug && formUserId) {
    const formOwnerUsername = await getUsernameByUserId(formUserId);
    if (formOwnerUsername) {
      revalidatePath(urls.form(formOwnerUsername, formSlug));
    }
  }
}

export const createFormAction = authenticatedActionClient
  .inputSchema(createFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole, userTier, supabase } = ctx;
    const isProEnabled = canUseProFeatures({ role: userRole, tier: userTier });
    const hasManualQuestions = (parsedInput.questions?.length ?? 0) > 0;
    const hasInstructions = parsedInput.instructions.trim().length > 0;

    if (!isProEnabled && !hasManualQuestions) {
      throw new Error("Free users can create forms only with manual questions");
    }
    if (isProEnabled && !hasManualQuestions && !hasInstructions) {
      throw new Error("Provide instructions or manual questions");
    }

    const slug = await createUniqueFormSlug({
      supabase,
      source: parsedInput.name,
    });

    if (!isProEnabled) {
      const manualQuestions = (parsedInput.questions ?? [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((question, questionIndex) => ({
          question: question.question,
          order: questionIndex,
          default_answers: question.default_answers
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((answer, answerIndex) => ({
              answer: answer.answer,
              order: answerIndex,
            })),
        }));

      const { data: form } = await supabase
        .from("form")
        .insert({
          user_id: userId,
          name: parsedInput.name,
          slug,
          is_published: parsedInput.isPublished ?? false,
          instructions: "",
          type: "default-only",
          language: parsedInput.language,
          voice_id: null,
        })
        .select("id, slug")
        .single()
        .throwOnError();

      try {
        if (manualQuestions.length > 0) {
          await supabase
            .from("question")
            .insert(
              manualQuestions.map((question) => ({
                ...question,
                user_id: userId,
                form_id: form.id,
              })),
            )
            .throwOnError();
        }
      } catch (error) {
        await supabase.from("form").delete().eq("id", form.id).throwOnError();
        throw error;
      }

      await revalidateFormPaths({
        formId: form.id,
        formSlug: form.slug,
        formUserId: userId,
      });

      return createFormStartResultSchema.parse({
        status: "completed",
        runId: null,
        formId: form.id,
      });
    }

    const handle = await formCreateTask.trigger(
      {
        ...parsedInput,
        userId,
        type: parsedInput.type,
        instructions: parsedInput.instructions,
        voiceId: parsedInput.voiceId,
        allowAiAndVoice: true,
        slug,
        isPublished: parsedInput.isPublished ?? false,
      },
      {
        maxAttempts: 1,
      },
    );

    return createFormStartResultSchema.parse({
      status: "processing",
      runId: handle.id,
      formId: null,
    });
  });

export const getCreateFormStatusAction = authenticatedActionClient
  .inputSchema(getCreateFormStatusSchema)
  .action(async ({ parsedInput }) => {
    try {
      const run = await runs.retrieve(parsedInput.runId);

      if (run.taskIdentifier !== "form-create") {
        return createFormStatusResultSchema.parse({
          status: "failed",
          formId: null,
        });
      }

      if (run.status === "COMPLETED") {
        const output = run.output as
          | {
              status?: unknown;
              formId?: unknown;
            }
          | undefined;

        if (output?.status === "completed" && typeof output.formId === "string") {
          const { data: form } = await supabaseAdmin
            .from("form")
            .select("id, slug, user_id")
            .eq("id", output.formId)
            .maybeSingle();

          await revalidateFormPaths({
            formId: output.formId,
            formSlug: form?.slug ?? null,
            formUserId: form?.user_id ?? null,
          });

          return createFormStatusResultSchema.parse({
            status: "completed",
            formId: output.formId,
          });
        }

        return createFormStatusResultSchema.parse({
          status: "failed",
          formId: null,
        });
      }

      if (TERMINAL_FAILURE_STATUSES.has(run.status)) {
        return createFormStatusResultSchema.parse({
          status: "failed",
          formId: null,
        });
      }

      return createFormStatusResultSchema.parse({
        status: "processing",
        formId: null,
      });
    } catch (error) {
      console.log("[get_create_form_status_failed]", {
        runId: parsedInput.runId,
        message: error instanceof Error ? error.message : String(error),
      });

      return createFormStatusResultSchema.parse({
        status: "failed",
        formId: null,
      });
    }
  });

export const getElevenLabsVoicesAction = authenticatedActionClient
  .inputSchema(getElevenLabsVoicesSchema)
  .action(async ({ ctx }) => {
    requireProFeatures({ userRole: ctx.userRole, userTier: ctx.userTier });

    const voices = await getElevenLabsVoices();
    const defaultVoiceId = getDefaultElevenLabsVoiceId();

    return { voices, defaultVoiceId };
  });

export const editFormAction = authenticatedActionClient
  .inputSchema(editFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userRole, userTier } = ctx;
    const isProEnabled = canUseProFeatures({ role: userRole, tier: userTier });
    const {
      formId,
      name,
      type,
      isPublished,
      theme,
      backgroundImageKey,
      backgroundMusicKey,
      introTitle,
      introMessage,
      endTitle,
      endMessage,
    } = parsedInput;

    const { data: currentForm } = await supabase
      .from("form")
      .select("id, slug, user_id")
      .eq("id", formId)
      .single()
      .throwOnError();

    const nextSlug = isPublished
      ? currentForm.slug?.trim() ||
        (await createUniqueFormSlug({
          supabase,
          source: name,
          excludeFormId: formId,
        }))
      : currentForm.slug;

    const { data: form, error } = await supabase
      .from("form")
      .update({
        name,
        type: isProEnabled ? type : "default-only",
        is_published: isPublished,
        slug: nextSlug,
        theme: theme ?? "dark",
        background_image_key: backgroundImageKey ?? null,
        background_music_key: backgroundMusicKey ?? null,
        intro_title: toNullableText(introTitle),
        intro_message: toNullableText(introMessage),
        end_title: toNullableText(endTitle),
        end_message: toNullableText(endMessage),
      })
      .eq("id", formId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await revalidateFormPaths({
      formId,
      formSlug: nextSlug,
      formUserId: currentForm.user_id,
    });

    return form;
  });

export const updateFormVoiceAction = authenticatedActionClient
  .inputSchema(updateFormVoiceSchema)
  .action(async ({ parsedInput, ctx }) => {
    requireProFeatures({ userRole: ctx.userRole, userTier: ctx.userTier });

    const { supabase } = ctx;
    const { formId, voiceId, voiceSpeed } = parsedInput;
    const normalizedVoiceId = voiceId.trim();
    const normalizedVoiceSpeed = Math.round(voiceSpeed * 100) / 100;

    const { data: form } = await supabase
      .from("form")
      .update({
        voice_id: normalizedVoiceId,
        voice_speed: normalizedVoiceSpeed,
      })
      .eq("id", formId)
      .select("id, slug, user_id")
      .single()
      .throwOnError();

    await revalidateFormPaths({
      formId,
      formSlug: form.slug,
      formUserId: form.user_id,
    });

    return {
      voiceId: normalizedVoiceId,
      voiceSpeed: normalizedVoiceSpeed,
    };
  });

export const regenerateFormQuestionsTTSAction = authenticatedActionClient
  .inputSchema(regenerateFormQuestionsTTSSchema)
  .action(async ({ parsedInput, ctx }) => {
    requireProFeatures({ userRole: ctx.userRole, userTier: ctx.userTier });

    const { supabase } = ctx;
    const { formId } = parsedInput;

    const { data: form } = await supabase
      .from("form")
      .select(
        "user_id, language, type, slug, voice_id, voice_speed, questions:question(id, question)",
      )
      .eq("id", formId)
      .order("order", { referencedTable: "question", ascending: true })
      .single()
      .throwOnError();

    const language = (form.language ?? "it") as FormLanguage;
    const voiceSpeed = typeof form.voice_speed === "number" ? form.voice_speed : null;
    const questions = (form.questions ?? []) as Array<{
      id: string;
      question: string;
    }>;

    if (questions.length > 0 && form.type !== "default-only") {
      const ttsResults = await Promise.all(
        questions.map((question) =>
          generateTTS({
            text: question.question,
            formId,
            language,
            voiceId: form.voice_id,
            voiceSpeed,
          }),
        ),
      );

      await Promise.all(
        questions.map((question, index) =>
          supabase
            .from("question")
            .update({
              file_key: ttsResults[index].key,
              file_generated_at: new Date().toUTCString(),
            })
            .eq("id", question.id)
            .eq("form_id", formId)
            .throwOnError(),
        ),
      );
    }

    await revalidateFormPaths({
      formId,
      formSlug: form.slug,
      formUserId: form.user_id,
    });

    return {
      regeneratedQuestionsCount: questions.length,
    };
  });

export const editQuestionsAction = authenticatedActionClient
  .inputSchema(editQuestionsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userRole, userTier } = ctx;
    const { questions, formId, language } = parsedInput;
    const isProEnabled = canUseProFeatures({ role: userRole, tier: userTier });

    const ids = questions.map((question) => question.id);

    const { data: currentQuestions } = await supabase
      .from("question")
      .select("id, question")
      .in("id", ids)
      .eq("form_id", formId)
      .throwOnError();

    const currentMap = new Map(
      (currentQuestions ?? []).map((question) => [question.id, question]),
    );

    const changedQuestions = questions.filter(
      (question) => currentMap.get(question.id)?.question !== question.question,
    );

    const { data: form } = await supabase
      .from("form")
      .select("user_id, slug, type, voice_id, voice_speed")
      .eq("id", formId)
      .single()
      .throwOnError();

    await Promise.all(
      questions.map((question) =>
        supabase
          .from("question")
          .update({
            question: question.question,
            default_answers: question.default_answers,
          })
          .eq("id", question.id)
          .eq("form_id", formId)
          .throwOnError(),
      ),
    );

    if (changedQuestions.length > 0 && isProEnabled && form.type !== "default-only") {
      const ttsResults = await Promise.all(
        changedQuestions.map((question) =>
          generateTTS({
            text: question.question,
            formId,
            language,
            voiceId: form.voice_id,
            voiceSpeed: form.voice_speed,
          }),
        ),
      );

      await Promise.all(
        changedQuestions.map((question, index) =>
          supabase
            .from("question")
            .update({
              file_key: ttsResults[index].key,
              file_generated_at: new Date().toUTCString(),
            })
            .eq("id", question.id)
            .eq("form_id", formId)
            .throwOnError(),
        ),
      );
    }

    await revalidateFormPaths({
      formId,
      formSlug: form.slug,
      formUserId: form.user_id,
    });

    return questions;
  });

export const addQuestionAction = authenticatedActionClient
  .inputSchema(addQuestionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { formId, question, answers } = parsedInput;

    const { data: form } = await supabase
      .from("form")
      .select("user_id, slug")
      .eq("id", formId)
      .single()
      .throwOnError();

    const { data: lastQuestion } = await supabase
      .from("question")
      .select("order")
      .eq("form_id", formId)
      .order("order", { ascending: false })
      .limit(1)
      .maybeSingle()
      .throwOnError();

    const nextOrder = (lastQuestion?.order ?? -1) + 1;

    await supabase
      .from("question")
      .insert({
        form_id: formId,
        user_id: form.user_id,
        question,
        order: nextOrder,
        default_answers: answers.map((answer, index) => ({
          answer,
          order: index,
        })),
      })
      .throwOnError();

    await revalidateFormPaths({
      formId,
      formSlug: form.slug,
      formUserId: form.user_id,
    });
  });

export const deleteQuestionAction = authenticatedActionClient
  .inputSchema(deleteQuestionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { questionId, formId } = parsedInput;

    const { data: form } = await supabase
      .from("form")
      .select("user_id, slug")
      .eq("id", formId)
      .single()
      .throwOnError();

    const { error } = await supabase
      .from("question")
      .delete()
      .eq("id", questionId)
      .eq("form_id", formId);

    if (error) throw error;

    await revalidateFormPaths({
      formId,
      formSlug: form.slug,
      formUserId: form.user_id,
    });
  });

export const deleteFormAction = authenticatedActionClient
  .inputSchema(deleteFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { formId } = parsedInput;

    const { error } = await supabase.from("form").delete().eq("id", formId);

    if (error) throw error;

    revalidatePath(urls.dashboard.forms.index);
    revalidatePath(urls.admin.forms.index);
  });

export const generateQuestionTTSAction = authenticatedActionClient
  .inputSchema(generateQuestionTTSSchema)
  .action(async ({ parsedInput, ctx }) => {
    requireProFeatures({ userRole: ctx.userRole, userTier: ctx.userTier });

    const { supabase } = ctx;
    const { questionId, formId, language } = parsedInput;

    const { data: question } = await supabase
      .from("question")
      .select("question")
      .eq("id", questionId)
      .eq("form_id", formId)
      .single()
      .throwOnError();

    if (!question) throw new Error("Question not found.");

    const { data: form } = await supabase
      .from("form")
      .select("user_id, slug, voice_id, voice_speed")
      .eq("id", formId)
      .single()
      .throwOnError();

    const { url, key } = await generateTTS({
      text: question.question,
      formId,
      language,
      voiceId: form.voice_id,
      voiceSpeed: form.voice_speed,
    });

    await supabase
      .from("question")
      .update({
        file_key: key,
        file_generated_at: new Date().toUTCString(),
      })
      .eq("id", questionId)
      .eq("form_id", formId)
      .throwOnError();

    await revalidateFormPaths({
      formId,
      formSlug: form.slug,
      formUserId: form.user_id,
    });

    return { url };
  });

export const saveFormAnalysisInstructionsAction = authenticatedActionClient
  .inputSchema(saveAnalysisInstructionsSchema)
  .action(async ({ parsedInput, ctx }) => {
    requireProFeatures({ userRole: ctx.userRole, userTier: ctx.userTier });

    const { supabase } = ctx;
    const { formId, analysisInstructions } = parsedInput;

    const trimmed = analysisInstructions.trim();

    const { data: form } = await supabase
      .from("form")
      .update({
        analysis_instructions: trimmed.length > 0 ? trimmed : null,
      })
      .eq("id", formId)
      .select("id, user_id, slug")
      .single()
      .throwOnError();

    await revalidateFormPaths({
      formId: form.id,
      formSlug: form.slug,
      formUserId: form.user_id,
    });

    return { analysisInstructions: trimmed.length > 0 ? trimmed : null };
  });
