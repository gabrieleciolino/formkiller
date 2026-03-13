import {
  ANALYSIS_PROMPT_MAX_CHARS,
  ANALYSIS_PROMPT_MAX_WORDS,
} from "@/features/forms/schema";
import {
  TEST_ANSWERS_PER_QUESTION,
  TEST_MAX_QUESTIONS,
  TEST_MIN_QUESTIONS,
  TEST_PROFILES_COUNT,
} from "@/features/tests/schema";
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

const generatedViralTestAnswerSchema = z.object({
  answer: z.string().trim().min(1),
  order: z.number().int(),
  scores: z.array(z.number().int().min(0)).length(TEST_PROFILES_COUNT),
});

const generatedViralTestQuestionSchema = z.object({
  question: z.string().trim().min(1),
  order: z.number().int(),
  answers: z.array(generatedViralTestAnswerSchema).length(TEST_ANSWERS_PER_QUESTION),
});

const generatedViralTestProfileSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  order: z.number().int(),
});

export const generateViralTestOutputSchema = z.object({
  name: z.string().trim().min(1),
  introTitle: z.string().trim().min(1),
  introMessage: z.string().trim().min(1),
  endTitle: z.string().trim().min(1),
  endMessage: z.string().trim().min(1),
  profiles: z.array(generatedViralTestProfileSchema).length(TEST_PROFILES_COUNT),
  questions: z
    .array(generatedViralTestQuestionSchema)
    .min(TEST_MIN_QUESTIONS)
    .max(TEST_MAX_QUESTIONS),
});
