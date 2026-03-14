import { formLanguageSchema } from "@/features/forms/schema";
import { z } from "zod";

export const TEST_PROFILES_COUNT = 4;
export const TEST_ANSWERS_PER_QUESTION = 4;
export const TEST_MIN_QUESTIONS = 3;
export const TEST_MAX_QUESTIONS = 12;
export const TEST_MIN_SCORE = 0;
export const TEST_MAX_SCORE = 10;
export const TEST_NAME_MAX_CHARS = 120;
export const TEST_ADDITIONAL_PROMPT_MAX_CHARS = 500;
export const TEST_CAROUSEL_SLIDES_COUNT = 4;
export const TEST_CAROUSEL_SLIDE_COPY_MAX_CHARS = 1200;
export const TEST_CAROUSEL_SLIDE_PROMPT_MAX_CHARS = 2000;

export const testStatusSchema = z.enum(["draft", "published"]);
export type TestStatus = z.infer<typeof testStatusSchema>;

export const testSlideKindSchema = z.enum([
  "intro",
  "question_1",
  "question_2",
  "cta",
]);
export type TestSlideKind = z.infer<typeof testSlideKindSchema>;

export const testSlideGenerationStatusSchema = z.enum([
  "idle",
  "processing",
  "completed",
  "failed",
]);
export type TestSlideGenerationStatus = z.infer<
  typeof testSlideGenerationStatusSchema
>;

export const TEST_CAROUSEL_SLIDE_DEFINITIONS: Array<{
  order: number;
  kind: TestSlideKind;
}> = [
  { order: 0, kind: "intro" },
  { order: 1, kind: "question_1" },
  { order: 2, kind: "question_2" },
  { order: 3, kind: "cta" },
];

export const testAnswerScoresSchema = z.tuple([
  z.number().int().min(TEST_MIN_SCORE).max(TEST_MAX_SCORE),
  z.number().int().min(TEST_MIN_SCORE).max(TEST_MAX_SCORE),
  z.number().int().min(TEST_MIN_SCORE).max(TEST_MAX_SCORE),
  z.number().int().min(TEST_MIN_SCORE).max(TEST_MAX_SCORE),
]);
export type TestAnswerScores = z.infer<typeof testAnswerScoresSchema>;

export const testAnswerSchema = z.object({
  answer: z.string().trim().min(1),
  order: z.number().int().nonnegative(),
  scores: testAnswerScoresSchema,
});
export type TestAnswer = z.infer<typeof testAnswerSchema>;

export const testQuestionSchema = z.object({
  id: z.string().uuid(),
  question: z.string().trim().min(1),
  order: z.number().int().nonnegative(),
  answers: z.array(testAnswerSchema).length(TEST_ANSWERS_PER_QUESTION),
});
export type TestQuestion = z.infer<typeof testQuestionSchema>;

export const testProfileSchema = z.object({
  id: z.string().uuid(),
  order: z.number().int().nonnegative(),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
});
export type TestProfile = z.infer<typeof testProfileSchema>;

export const generateTestDraftSchema = z.object({
  additionalPrompt: z
    .string()
    .trim()
    .max(TEST_ADDITIONAL_PROMPT_MAX_CHARS),
  questionsCount: z.number().int().min(TEST_MIN_QUESTIONS).max(TEST_MAX_QUESTIONS),
  language: formLanguageSchema,
});
export type GenerateTestDraftType = z.infer<typeof generateTestDraftSchema>;

export const editableTestSchema = z.object({
  name: z.string().trim().min(1).max(TEST_NAME_MAX_CHARS),
  language: formLanguageSchema,
  isPublished: z.boolean(),
  introTitle: z.string().trim().min(1),
  introMessage: z.string().trim().min(1),
  endTitle: z.string().trim().min(1),
  endMessage: z.string().trim().min(1),
  profiles: z.array(testProfileSchema).length(TEST_PROFILES_COUNT),
  questions: z.array(testQuestionSchema).min(TEST_MIN_QUESTIONS).max(TEST_MAX_QUESTIONS),
});
export type EditableTestType = z.infer<typeof editableTestSchema>;

export const createTestSchema = editableTestSchema;
export type CreateTestType = z.infer<typeof createTestSchema>;

export const updateTestSchema = editableTestSchema.extend({
  testId: z.string().uuid(),
});
export type UpdateTestType = z.infer<typeof updateTestSchema>;

export const editTestCustomizationSchema = z.object({
  testId: z.string().uuid(),
  backgroundImageKey: z.string().nullable().optional(),
  backgroundMusicKey: z.string().nullable().optional(),
});
export type EditTestCustomizationType = z.infer<
  typeof editTestCustomizationSchema
>;

export const deleteTestSchema = z.object({
  testId: z.string().uuid(),
});
export type DeleteTestType = z.infer<typeof deleteTestSchema>;

export const editableTestSlideSchema = z.object({
  order: z.number().int().min(0).max(TEST_CAROUSEL_SLIDES_COUNT - 1),
  kind: testSlideKindSchema,
  copy: z
    .string()
    .trim()
    .min(1)
    .max(TEST_CAROUSEL_SLIDE_COPY_MAX_CHARS),
  imagePrompt: z
    .string()
    .trim()
    .min(1)
    .max(TEST_CAROUSEL_SLIDE_PROMPT_MAX_CHARS),
  imageFileKey: z.string().nullable().optional(),
  generationStatus: testSlideGenerationStatusSchema.optional(),
  generationError: z.string().nullable().optional(),
});
export type EditableTestSlideType = z.infer<typeof editableTestSlideSchema>;

export const generateTestCarouselDraftSchema = z.object({
  testId: z.string().uuid(),
});
export type GenerateTestCarouselDraftType = z.infer<
  typeof generateTestCarouselDraftSchema
>;

export const saveTestCarouselDraftSchema = z.object({
  testId: z.string().uuid(),
  slides: z.array(editableTestSlideSchema).length(TEST_CAROUSEL_SLIDES_COUNT),
});
export type SaveTestCarouselDraftType = z.infer<
  typeof saveTestCarouselDraftSchema
>;

export const triggerTestCarouselGenerationSchema = z.object({
  testId: z.string().uuid(),
  slideOrder: z.number().int().min(0).max(TEST_CAROUSEL_SLIDES_COUNT - 1),
  copy: z
    .string()
    .trim()
    .min(1)
    .max(TEST_CAROUSEL_SLIDE_COPY_MAX_CHARS),
  imagePrompt: z
    .string()
    .trim()
    .min(1)
    .max(TEST_CAROUSEL_SLIDE_PROMPT_MAX_CHARS),
});
export type TriggerTestCarouselGenerationType = z.infer<
  typeof triggerTestCarouselGenerationSchema
>;

export const saveTestResultSchema = z.object({
  testId: z.string().uuid(),
  profileId: z.string().uuid(),
  language: formLanguageSchema,
  scoreTotals: testAnswerScoresSchema,
  answerSelections: z.array(
    z.object({
      questionId: z.string().uuid(),
      answerOrder: z.number().int().min(0).max(TEST_ANSWERS_PER_QUESTION - 1),
      scores: testAnswerScoresSchema,
    }),
  ),
});
export type SaveTestResultType = z.infer<typeof saveTestResultSchema>;
