"use server";

import {
  createTestSchema,
  deleteTestSchema,
  editTestCustomizationSchema,
  generateTestDraftSchema,
  getTestVoicesSchema,
  TEST_ANSWERS_PER_QUESTION,
  TEST_PROFILES_COUNT,
  updateTestSchema,
  type EditableTestType,
} from "@/features/tests/schema";
import type { FormLanguage } from "@/features/forms/schema";
import { adminActionClient } from "@/lib/actions";
import { generateViralTest } from "@/lib/ai/functions";
import {
  generateTTS,
  getDefaultElevenLabsVoiceId,
  getElevenLabsVoices,
} from "@/lib/elevenlabs/functions";
import { deleteFile } from "@/lib/r2/functions";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { urls } from "@/lib/urls";
import { revalidatePath } from "next/cache";

const DEFAULT_TEST_BACKGROUND_ASSET_ID = "b0e66024-24c6-482a-b857-ffdb1a121c03";

const toNullableText = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

async function resolveDefaultTestBackgroundImageKey(
  client: TypedSupabaseClient,
) {
  const { data, error } = await client
    .from("asset")
    .select("file_key")
    .eq("id", DEFAULT_TEST_BACKGROUND_ASSET_ID)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const fileKey =
    data && typeof data.file_key === "string" ? data.file_key : null;

  if (!fileKey) {
    throw new Error(
      `Default test background asset not found: ${DEFAULT_TEST_BACKGROUND_ASSET_ID}`,
    );
  }

  return fileKey;
}

const slugify = (value: string) => {
  const base = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 72);

  return base.length > 0 ? base : "test";
};

async function createUniqueTestSlug({
  client,
  source,
}: {
  client: TypedSupabaseClient;
  source: string;
}) {
  const base = slugify(source);
  let slug = base;
  let suffix = 2;

  while (true) {
    const { data, error } = await client
      .from("test")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return slug;
    }

    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

function compactToken(value: string, maxChars = 36) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxChars);
}

async function buildExistingTestsDigest({
  client,
  language,
}: {
  client: TypedSupabaseClient;
  language: FormLanguage;
}) {
  const { data, error } = await client
    .from("test")
    .select(
      "name, slug, language, questions:test_question(question, order), profiles:test_profile(title, order)",
    )
    .eq("language", language)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return "Nessuno";
  }

  const lines: string[] = [];

  for (const row of data) {
    const questionsRaw = Array.isArray(row.questions)
      ? row.questions
      : [];
    const profilesRaw = Array.isArray(row.profiles)
      ? row.profiles
      : [];

    const questionTokens = questionsRaw
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .slice(0, 2)
      .map((question) => compactToken(question.question ?? "", 26))
      .filter(Boolean)
      .join("/");

    const profileTokens = profilesRaw
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .slice(0, 2)
      .map((profile) => compactToken(profile.title ?? "", 18))
      .filter(Boolean)
      .join("/");

    lines.push(
      `${compactToken(row.slug ?? "", 18)}|${compactToken(row.name ?? "", 34)}|Q:${questionTokens || "-"}|P:${profileTokens || "-"}`,
    );
  }

  return lines.join("\n").slice(0, 2400);
}

function toScoresTuple(scores: number[]): [number, number, number, number] {
  const sanitized = scores
    .slice(0, TEST_PROFILES_COUNT)
    .map((value) => Math.max(0, Math.trunc(value)));

  while (sanitized.length < TEST_PROFILES_COUNT) {
    sanitized.push(0);
  }

  return [
    sanitized[0] ?? 0,
    sanitized[1] ?? 0,
    sanitized[2] ?? 0,
    sanitized[3] ?? 0,
  ];
}

function normalizeEditableDraft(input: {
  name: string;
  introTitle: string;
  introMessage: string;
  endTitle: string;
  endMessage: string;
  profiles: Array<{ title: string; description: string; order: number }>;
  questions: Array<{
    question: string;
    order: number;
    answers: Array<{
      answer: string;
      order: number;
      scores: number[];
    }>;
  }>;
}): EditableTestType {
  return {
    name: input.name,
    language: "it",
    voiceId: undefined,
    isPublished: false,
    introTitle: input.introTitle,
    introMessage: input.introMessage,
    endTitle: input.endTitle,
    endMessage: input.endMessage,
    profiles: input.profiles
      .slice()
      .sort((a, b) => a.order - b.order)
      .slice(0, TEST_PROFILES_COUNT)
      .map((profile, index) => ({
        id: crypto.randomUUID(),
        order: index,
        title: profile.title,
        description: profile.description,
      })),
    questions: input.questions
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((question, questionIndex) => ({
        id: crypto.randomUUID(),
        order: questionIndex,
        question: question.question,
        answers: question.answers
          .slice()
          .sort((a, b) => a.order - b.order)
          .slice(0, TEST_ANSWERS_PER_QUESTION)
          .map((answer, answerIndex) => ({
            answer: answer.answer,
            order: answerIndex,
            scores: toScoresTuple(answer.scores),
          })),
      })),
  };
}

export const generateTestDraftAction = adminActionClient
  .inputSchema(generateTestDraftSchema)
  .action(async ({ parsedInput, ctx }) => {
    const existingTestsDigest = await buildExistingTestsDigest({
      client: ctx.supabase,
      language: parsedInput.language,
    });

    const output = await generateViralTest({
      additionalPrompt: parsedInput.additionalPrompt,
      existingTestsDigest,
      language: parsedInput.language,
      questionsCount: parsedInput.questionsCount,
    });

    const normalized = normalizeEditableDraft(output);

    return {
      ...normalized,
      language: parsedInput.language,
    };
  });

export const getTestVoicesAction = adminActionClient
  .inputSchema(getTestVoicesSchema)
  .action(async () => {
    const voices = await getElevenLabsVoices();
    const defaultVoiceId = getDefaultElevenLabsVoiceId();

    return { voices, defaultVoiceId };
  });

export const createTestAction = adminActionClient
  .inputSchema(createTestSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;
    const client = supabase;
    const generatedTtsKeys: string[] = [];
    let createdTestId: string | null = null;
    const normalizedVoiceId = parsedInput.voiceId?.trim() || null;
    const fallbackVoiceId = getDefaultElevenLabsVoiceId();
    const resolvedVoiceId = normalizedVoiceId ?? fallbackVoiceId;

    try {
      const slug = await createUniqueTestSlug({
        client,
        source: parsedInput.name,
      });
      const defaultBackgroundImageKey =
        await resolveDefaultTestBackgroundImageKey(client);

      const { data: createdTest, error: createTestError } = (await client
        .from("test")
        .insert({
          user_id: userId,
          name: parsedInput.name,
          slug,
          language: parsedInput.language,
          voice_id: resolvedVoiceId,
          status: parsedInput.isPublished ? "published" : "draft",
          is_published: parsedInput.isPublished,
          background_image_key: defaultBackgroundImageKey,
          intro_title: toNullableText(parsedInput.introTitle),
          intro_message: toNullableText(parsedInput.introMessage),
          end_title: toNullableText(parsedInput.endTitle),
          end_message: toNullableText(parsedInput.endMessage),
        })
        .select("id, slug")
        .single()) as {
        data: { id: string; slug: string } | null;
        error: { message: string } | null;
      };

      if (createTestError || !createdTest) {
        throw createTestError ?? new Error("Test not created");
      }

      createdTestId = createdTest.id;

      const { error: profilesError } = await client.from("test_profile").insert(
        parsedInput.profiles.map((profile, index) => ({
          test_id: createdTest.id,
          order: index,
          title: profile.title,
          description: profile.description,
        })),
      );

      if (profilesError) {
        throw profilesError;
      }

      const { data: insertedQuestions, error: questionsError } = await client
        .from("test_question")
        .insert(
          parsedInput.questions.map((question, questionIndex) => ({
            test_id: createdTest.id,
            order: questionIndex,
            question: question.question,
            answers: question.answers.map((answer, answerIndex) => ({
              answer: answer.answer,
              order: answerIndex,
              scores: answer.scores,
            })),
          })),
        )
        .select("id, question") as {
        data: Array<{ id: string; question: string }> | null;
        error: { message: string } | null;
      };

      if (questionsError || !insertedQuestions) {
        throw questionsError ?? new Error("Questions not created");
      }

      const ttsResults = await Promise.all(
        insertedQuestions.map((question) =>
          generateTTS({
            text: question.question,
            formId: createdTest.id,
            language: parsedInput.language,
            voiceId: resolvedVoiceId,
          }),
        ),
      );

      generatedTtsKeys.push(...ttsResults.map((result) => result.key));

      await Promise.all(
        insertedQuestions.map((question, index) =>
          client
            .from("test_question")
            .update({
              file_key: ttsResults[index].key,
              file_generated_at: new Date().toISOString(),
            })
            .eq("id", question.id)
            .eq("test_id", createdTest.id),
        ),
      );

      revalidatePath(urls.admin.tests.index);
      revalidatePath(urls.admin.tests.detail(createdTest.id));
      revalidatePath(urls.test(createdTest.slug));

      return {
        id: createdTest.id,
        slug: createdTest.slug,
      };
    } catch (error) {
      if (createdTestId) {
        await client.from("test").delete().eq("id", createdTestId);
      }

      if (generatedTtsKeys.length > 0) {
        await Promise.allSettled(generatedTtsKeys.map((key) => deleteFile(key)));
      }

      throw error;
    }
  });

export const updateTestAction = adminActionClient
  .inputSchema(updateTestSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const client = supabase;
    const normalizedVoiceId = parsedInput.voiceId?.trim() || null;
    const fallbackVoiceId = getDefaultElevenLabsVoiceId();
    const resolvedVoiceId = normalizedVoiceId ?? fallbackVoiceId;

    const { data: currentTest, error: currentTestError } = (await client
      .from("test")
      .select("id, slug")
      .eq("id", parsedInput.testId)
      .single()) as {
      data: { id: string; slug: string } | null;
      error: { message: string } | null;
    };

    if (currentTestError || !currentTest) {
      throw currentTestError ?? new Error("Test not found");
    }

    const { data: currentQuestions, error: currentQuestionsError } = (await client
      .from("test_question")
      .select("file_key")
      .eq("test_id", parsedInput.testId)) as {
      data: Array<{ file_key: string | null }> | null;
      error: { message: string } | null;
    };

    if (currentQuestionsError) {
      throw currentQuestionsError;
    }

    const oldAudioKeys = (currentQuestions ?? [])
      .map((question) => question.file_key)
      .filter((key): key is string => Boolean(key));
    const defaultBackgroundImageKey =
      await resolveDefaultTestBackgroundImageKey(client);

    const { error: updateTestError } = await client
      .from("test")
      .update({
        name: parsedInput.name,
        language: parsedInput.language,
        voice_id: resolvedVoiceId,
        status: parsedInput.isPublished ? "published" : "draft",
        is_published: parsedInput.isPublished,
        background_image_key: defaultBackgroundImageKey,
        intro_title: toNullableText(parsedInput.introTitle),
        intro_message: toNullableText(parsedInput.introMessage),
        end_title: toNullableText(parsedInput.endTitle),
        end_message: toNullableText(parsedInput.endMessage),
      })
      .eq("id", parsedInput.testId);

    if (updateTestError) {
      throw updateTestError;
    }

    await client.from("test_profile").delete().eq("test_id", parsedInput.testId);
    await client.from("test_question").delete().eq("test_id", parsedInput.testId);

    const { error: profilesError } = await client.from("test_profile").insert(
      parsedInput.profiles.map((profile, index) => ({
        test_id: parsedInput.testId,
        order: index,
        title: profile.title,
        description: profile.description,
      })),
    );

    if (profilesError) {
      throw profilesError;
    }

    const { data: insertedQuestions, error: questionsError } = await client
      .from("test_question")
      .insert(
        parsedInput.questions.map((question, questionIndex) => ({
          test_id: parsedInput.testId,
          order: questionIndex,
          question: question.question,
          answers: question.answers.map((answer, answerIndex) => ({
            answer: answer.answer,
            order: answerIndex,
            scores: answer.scores,
          })),
        })),
      )
      .select("id, question") as {
      data: Array<{ id: string; question: string }> | null;
      error: { message: string } | null;
    };

    if (questionsError || !insertedQuestions) {
      throw questionsError ?? new Error("Questions not created");
    }

    const ttsResults = await Promise.all(
      insertedQuestions.map((question) =>
        generateTTS({
          text: question.question,
          formId: parsedInput.testId,
          language: parsedInput.language,
          voiceId: resolvedVoiceId,
        }),
      ),
    );

    await Promise.all(
      insertedQuestions.map((question, index) =>
        client
          .from("test_question")
          .update({
            file_key: ttsResults[index].key,
            file_generated_at: new Date().toISOString(),
          })
          .eq("id", question.id)
          .eq("test_id", parsedInput.testId),
      ),
    );

    await Promise.allSettled(oldAudioKeys.map((key) => deleteFile(key)));

    revalidatePath(urls.admin.tests.index);
    revalidatePath(urls.admin.tests.detail(parsedInput.testId));
    revalidatePath(urls.test(currentTest.slug));

    return {
      id: parsedInput.testId,
      slug: currentTest.slug,
    };
  });

export const editTestCustomizationAction = adminActionClient
  .inputSchema(editTestCustomizationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const client = supabase;
    const defaultBackgroundImageKey =
      await resolveDefaultTestBackgroundImageKey(client);

    const { data: updatedTest, error: updateTestError } = (await client
      .from("test")
      .update({
        background_image_key: defaultBackgroundImageKey,
        background_music_key: parsedInput.backgroundMusicKey ?? null,
      })
      .eq("id", parsedInput.testId)
      .select("id, slug")
      .single()) as {
      data: { id: string; slug: string } | null;
      error: { message: string } | null;
    };

    if (updateTestError || !updatedTest) {
      throw updateTestError ?? new Error("Test not found");
    }

    revalidatePath(urls.admin.tests.index);
    revalidatePath(urls.admin.tests.detail(parsedInput.testId));
    revalidatePath(urls.test(updatedTest.slug));

    return {
      id: updatedTest.id,
      slug: updatedTest.slug,
    };
  });

export const deleteTestAction = adminActionClient
  .inputSchema(deleteTestSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const client = supabase;

    const { data: currentTest, error: currentTestError } = (await client
      .from("test")
      .select("slug")
      .eq("id", parsedInput.testId)
      .single()) as {
      data: { slug: string } | null;
      error: { message: string } | null;
    };

    if (currentTestError || !currentTest) {
      throw currentTestError ?? new Error("Test not found");
    }

    const { data: currentQuestions } = (await client
      .from("test_question")
      .select("file_key")
      .eq("test_id", parsedInput.testId)) as {
      data: Array<{ file_key: string | null }> | null;
      error: { message: string } | null;
    };

    const audioKeys = (currentQuestions ?? [])
      .map((question) => question.file_key)
      .filter((key): key is string => Boolean(key));

    const { error: deleteError } = await client
      .from("test")
      .delete()
      .eq("id", parsedInput.testId);

    if (deleteError) {
      throw deleteError;
    }

    await Promise.allSettled(audioKeys.map((key) => deleteFile(key)));

    revalidatePath(urls.admin.tests.index);
    revalidatePath(urls.test(currentTest.slug));
  });
