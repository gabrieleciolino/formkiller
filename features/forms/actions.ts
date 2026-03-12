"use server";

import {
  addQuestionSchema,
  assignFormUserSchema,
  createFormSchema,
  deleteFormSchema,
  deleteQuestionSchema,
  editFormSchema,
  editQuestionsSchema,
  generateQuestionTTSSchema,
  unassignFormUserSchema,
} from "@/features/forms/schema";
import { adminActionClient } from "@/lib/actions";
import { generateForm } from "@/lib/ai/functions";
import { generateTTS } from "@/lib/elevenlabs/functions";
import { deleteFile } from "@/lib/r2/functions";
import { urls } from "@/lib/urls";
import { revalidatePath } from "next/cache";

export const createFormAction = adminActionClient
  .inputSchema(createFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;
    const { name, instructions, type, language } = parsedInput;
    const generatedTtsKeys: string[] = [];
    let createdFormId: string | null = null;

    try {
      const output = await generateForm({ instructions, language });
      if (!output || output.questions.length === 0) {
        throw new Error("Empty AI output.");
      }

      const toNullableText = (value: string) => {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      const { data: form, error } = await supabase
        .from("form")
        .insert({
          name,
          instructions,
          type,
          language,
          user_id: userId,
          intro_title: toNullableText(output.introTitle),
          intro_message: toNullableText(output.introMessage),
          end_title: toNullableText(output.endTitle),
          end_message: toNullableText(output.endMessage),
        })
        .select()
        .single();

      if (error || !form) {
        throw error ?? new Error("Form not created");
      }

      createdFormId = form.id;

      const insertedQuestions = await Promise.all(
        output.questions.map(async (question) => {
          const { data, error: insertError } = await supabase
            .from("question")
            .insert({
              question: question.question,
              order: question.order,
              default_answers: question.defaultAnswers,
              form_id: form.id,
              user_id: userId,
            })
            .select()
            .single();

          if (insertError || !data) {
            throw insertError ?? new Error("Question not created");
          }

          return data;
        }),
      );

      const ttsResults = await Promise.all(
        insertedQuestions.map((question) =>
          generateTTS({
            text: question.question,
            formId: form.id,
            language: form.language,
          }),
        ),
      );
      generatedTtsKeys.push(...ttsResults.map((result) => result.key));

      await Promise.all(
        insertedQuestions.map((question, index) =>
          supabase
            .from("question")
            .update({
              file_key: ttsResults[index].key,
              file_generated_at: new Date().toUTCString(),
            })
            .eq("id", question.id)
            .throwOnError(),
        ),
      );

      revalidatePath(urls.dashboard.forms.index);
      revalidatePath(urls.admin.forms.index);

      return form;
    } catch (error) {
      if (createdFormId) {
        try {
          await supabase
            .from("form")
            .delete()
            .eq("id", createdFormId)
            .eq("user_id", userId)
            .throwOnError();
        } catch (cleanupError) {
          console.log("[create_form_cleanup_error]", cleanupError);
        }
      }

      if (generatedTtsKeys.length > 0) {
        await Promise.allSettled(generatedTtsKeys.map((key) => deleteFile(key)));
      }

      throw error;
    }
  });

export const editFormAction = adminActionClient
  .inputSchema(editFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const {
      formId,
      name,
      type,
      theme,
      backgroundImageKey,
      backgroundMusicKey,
      introTitle,
      introMessage,
      endTitle,
      endMessage,
    } = parsedInput;

    const toNullableText = (value: string) => {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const { data: form, error } = await supabase
      .from("form")
      .update({
        name,
        type,
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

    revalidatePath(urls.dashboard.forms.index);
    revalidatePath(urls.dashboard.forms.detail(formId));
    revalidatePath(urls.admin.forms.index);
    revalidatePath(urls.admin.forms.detail(formId));

    return form;
  });

export const editQuestionsAction = adminActionClient
  .inputSchema(editQuestionsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { questions, formId, language } = parsedInput;

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

    if (changedQuestions.length > 0) {
      const ttsResults = await Promise.all(
        changedQuestions.map((question) =>
          generateTTS({
            text: question.question,
            formId,
            language,
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

    revalidatePath(urls.dashboard.forms.detail(formId));
    revalidatePath(urls.admin.forms.detail(formId));

    return questions;
  });

export const addQuestionAction = adminActionClient
  .inputSchema(addQuestionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { formId, question, answers } = parsedInput;

    const { data: form } = await supabase
      .from("form")
      .select("user_id")
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

    revalidatePath(urls.dashboard.forms.detail(formId));
    revalidatePath(urls.admin.forms.detail(formId));
  });

export const deleteQuestionAction = adminActionClient
  .inputSchema(deleteQuestionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { questionId, formId } = parsedInput;

    const { error } = await supabase
      .from("question")
      .delete()
      .eq("id", questionId)
      .eq("form_id", formId);

    if (error) throw error;

    revalidatePath(urls.dashboard.forms.detail(formId));
    revalidatePath(urls.admin.forms.detail(formId));
  });

export const deleteFormAction = adminActionClient
  .inputSchema(deleteFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { formId } = parsedInput;

    const { error } = await supabase.from("form").delete().eq("id", formId);

    if (error) throw error;

    revalidatePath(urls.dashboard.forms.index);
    revalidatePath(urls.admin.forms.index);
  });

export const generateQuestionTTSAction = adminActionClient
  .inputSchema(generateQuestionTTSSchema)
  .action(async ({ parsedInput, ctx }) => {
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

    const { url, key } = await generateTTS({
      text: question.question,
      formId,
      language,
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

    revalidatePath(urls.dashboard.forms.detail(formId));
    revalidatePath(urls.admin.forms.detail(formId));

    return { url };
  });

export const assignUserToFormAction = adminActionClient
  .inputSchema(assignFormUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId: adminUserId } = ctx;
    const { formId, userId } = parsedInput;

    await supabase
      .from("form_assignment")
      .upsert(
        {
          form_id: formId,
          user_id: userId,
          assigned_by: adminUserId,
          active: true,
        },
        { onConflict: "form_id,user_id" },
      )
      .throwOnError();

    revalidatePath(urls.admin.forms.detail(formId));
    revalidatePath(urls.dashboard.forms.index);
  });

export const unassignUserFromFormAction = adminActionClient
  .inputSchema(unassignFormUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { formId, userId } = parsedInput;

    await supabase
      .from("form_assignment")
      .update({ active: false })
      .eq("form_id", formId)
      .eq("user_id", userId)
      .throwOnError();

    revalidatePath(urls.admin.forms.detail(formId));
    revalidatePath(urls.dashboard.forms.index);
  });
