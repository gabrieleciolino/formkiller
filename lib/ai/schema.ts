import {
  ANALYSIS_PROMPT_MAX_CHARS,
  ANALYSIS_PROMPT_MAX_WORDS,
} from "@/features/forms/schema";
import z from "zod";

const hasMaxWords = (value: string, maxWords: number) =>
  value
    .split(/\s+/)
    .filter((token) => token.trim().length > 0).length <= maxWords;

const generatedQuestionSchema = z.object({
  question: z.string(),
  order: z.number().describe("Integer. Position of the question"),
  defaultAnswers: z
    .array(
      z.object({
        answer: z.string(),
        order: z.number().describe("Integer. Position of the answer"),
      }),
    )
    .length(4),
});

export const generateFormSchema = z.object({
  questions: z.array(generatedQuestionSchema).min(5).max(10),
});

export const generateFormOutputSchema = z.object({
  introTitle: z.string().min(1),
  introMessage: z.string().min(1),
  endTitle: z.string().min(1),
  endMessage: z.string().min(1),
  questions: z.array(generatedQuestionSchema).min(5).max(10),
});

export const generateAnalysisInstructionsOutputSchema = z.object({
  analysisInstructions: z
    .string()
    .trim()
    .min(1)
    .max(ANALYSIS_PROMPT_MAX_CHARS)
    .refine((value) => hasMaxWords(value, ANALYSIS_PROMPT_MAX_WORDS)),
});

export const generateCompletionAnalysisOutputSchema = z.object({
  analysis: z
    .string()
    .trim()
    .min(1)
    .max(ANALYSIS_PROMPT_MAX_CHARS)
    .refine((value) => hasMaxWords(value, ANALYSIS_PROMPT_MAX_WORDS)),
});
