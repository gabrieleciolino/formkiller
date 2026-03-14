"use server";

import { saveTestResultSchema } from "@/features/tests/schema";
import { publicActionClient } from "@/lib/actions";

export const saveTestResultAction = publicActionClient
  .inputSchema(saveTestResultSchema)
  .action(async ({ parsedInput, ctx }) => {
    const client = ctx.supabase;

    const { data: test, error: testError } = await client
      .from("test")
      .select("id")
      .eq("id", parsedInput.testId)
      .eq("status", "published")
      .eq("is_published", true)
      .maybeSingle();

    if (testError) {
      throw testError;
    }

    if (!test) {
      throw new Error("Test not found");
    }

    const { data: profile, error: profileError } = await client
      .from("test_profile")
      .select("id")
      .eq("id", parsedInput.profileId)
      .eq("test_id", parsedInput.testId)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      throw new Error("Profile not found");
    }

    const { data, error } = (await client
      .from("test_result")
      .insert({
        test_id: parsedInput.testId,
        profile_id: parsedInput.profileId,
        language: parsedInput.language,
        score_totals: parsedInput.scoreTotals,
        answer_selections: parsedInput.answerSelections,
      })
      .select("id")
      .single()) as {
      data: { id: string } | null;
      error: { message: string } | null;
    };

    if (error || !data) {
      throw error ?? new Error("Result not saved");
    }

    return {
      id: data.id,
    };
  });
