import { formLanguageSchema } from "@/features/forms/schema";
import { generateSTT } from "@/lib/deepgram/functions";
import { getFileBuffer } from "@/lib/r2/functions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger, task } from "@trigger.dev/sdk/v3";
import { z } from "zod";

const formAnswerSttPayloadSchema = z.object({
  answerId: z.string().uuid(),
  fileKey: z.string().min(1),
  language: formLanguageSchema,
  audioMimeType: z.string().trim().min(1).optional(),
});

type FormAnswerSttPayload = z.infer<typeof formAnswerSttPayloadSchema>;

export const formAnswerSttTask = task({
  id: "form-answer-stt",
  run: async (payload: FormAnswerSttPayload) => {
    const parsedPayload = formAnswerSttPayloadSchema.parse(payload);
    const mimeType = parsedPayload.audioMimeType ?? "audio/webm";

    logger.log("Starting background STT transcription", {
      answerId: parsedPayload.answerId,
      fileKey: parsedPayload.fileKey,
      mimeType,
    });

    const buffer = await getFileBuffer(parsedPayload.fileKey);
    const transcript = await generateSTT({
      buffer,
      mimeType,
      language: parsedPayload.language,
    });

    const normalizedTranscript = transcript.trim();

    await supabaseAdmin
      .from("answer")
      .update({
        stt: normalizedTranscript.length > 0 ? normalizedTranscript : null,
      })
      .eq("id", parsedPayload.answerId)
      .throwOnError();

    logger.log("Completed background STT transcription", {
      answerId: parsedPayload.answerId,
      transcriptLength: normalizedTranscript.length,
    });

    return {
      answerId: parsedPayload.answerId,
      transcriptLength: normalizedTranscript.length,
    };
  },
});
