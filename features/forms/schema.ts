import { z } from "zod";

export const ANALYSIS_PROMPT_MAX_WORDS = 40;
export const ANALYSIS_PROMPT_MAX_CHARS = 255;

const hasMaxWords = (value: string, maxWords: number) =>
  value.split(/\s+/).filter((token) => token.trim().length > 0).length <=
  maxWords;

export const formTypeSchema = z.enum(["mixed", "default-only", "voice-only"]);
export type FormType = z.infer<typeof formTypeSchema>;

export const FORM_TYPE_LABELS: Record<FormType, string> = {
  mixed: "Voice + buttons",
  "default-only": "Only buttons",
  "voice-only": "Only voice",
};

export const formLanguageSchema = z.enum(["en", "it", "es"]);
export type FormLanguage = z.infer<typeof formLanguageSchema>;

export const completionAnalysisStatusSchema = z.enum([
  "idle",
  "processing",
  "completed",
  "failed",
  "unavailable",
]);
export type CompletionAnalysisStatus = z.infer<
  typeof completionAnalysisStatusSchema
>;

export const turnstileTokenSchema = z.string().trim().min(1);
export type TurnstileToken = z.infer<typeof turnstileTokenSchema>;

export const FORM_LANGUAGE_LABELS: Record<FormLanguage, string> = {
  en: "English",
  it: "Italiano",
  es: "Español",
};

export const createFormSchema = z.object({
  name: z.string().min(1),
  instructions: z.string().min(1),
  type: formTypeSchema,
  language: formLanguageSchema,
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        order: z.number().int().nonnegative(),
        default_answers: z
          .array(
            z.object({
              answer: z.string().min(1),
              order: z.number().int().nonnegative(),
            }),
          )
          .length(4),
      }),
    )
    .optional(),
});

export type CreateFormType = z.infer<typeof createFormSchema>;

export const formThemeSchema = z.enum(["light", "dark"]);
export type FormTheme = z.infer<typeof formThemeSchema>;

export const editFormSchema = z.object({
  formId: z.string().uuid(),
  name: z.string().trim().min(1),
  type: formTypeSchema,
  theme: formThemeSchema,
  backgroundImageKey: z.string().nullable().optional(),
  backgroundMusicKey: z.string().nullable().optional(),
  introTitle: z.string(),
  introMessage: z.string(),
  endTitle: z.string(),
  endMessage: z.string(),
});

export type EditFormType = z.infer<typeof editFormSchema>;

export const editQuestionsSchema = z.object({
  formId: z.string().uuid(),
  language: formLanguageSchema,
  questions: z.array(
    z.object({
      id: z.string().uuid(),
      question: z.string().min(1),
      order: z.number().int().nonnegative(),
      default_answers: z.array(
        z.object({
          answer: z.string().min(1),
          order: z.number().int().nonnegative(),
        }),
      ),
    }),
  ),
});

export type EditQuestionsType = z.infer<typeof editQuestionsSchema>;

export const addQuestionSchema = z.object({
  formId: z.string().uuid(),
  question: z.string().min(1),
  answers: z.array(z.string().min(1)).length(4),
});

export type AddQuestionType = z.infer<typeof addQuestionSchema>;

export const addQuestionFormSchema = z.object({
  question: z.string().min(1),
  answers: z.tuple([
    z.string().min(1),
    z.string().min(1),
    z.string().min(1),
    z.string().min(1),
  ]),
});

export type AddQuestionFormType = z.infer<typeof addQuestionFormSchema>;

export const deleteQuestionSchema = z.object({
  questionId: z.string().uuid(),
  formId: z.string().uuid(),
});

export type DeleteQuestionType = z.infer<typeof deleteQuestionSchema>;

export const deleteFormSchema = z.object({
  formId: z.string().uuid(),
});

export type DeleteFormType = z.infer<typeof deleteFormSchema>;

export const generateQuestionTTSSchema = z.object({
  questionId: z.string().uuid(),
  formId: z.string().uuid(),
  language: formLanguageSchema,
});

export type GenerateQuestionTTSType = z.infer<typeof generateQuestionTTSSchema>;

export const generateAnalysisInstructionsSchema = z.object({
  formId: z.string().uuid(),
  additionalPrompt: z
    .string()
    .trim()
    .max(ANALYSIS_PROMPT_MAX_CHARS)
    .refine((value) => hasMaxWords(value, ANALYSIS_PROMPT_MAX_WORDS)),
});

export type GenerateAnalysisInstructionsType = z.infer<
  typeof generateAnalysisInstructionsSchema
>;

export const saveAnalysisInstructionsSchema = z.object({
  formId: z.string().uuid(),
  analysisInstructions: z
    .string()
    .trim()
    .max(ANALYSIS_PROMPT_MAX_CHARS)
    .refine((value) => hasMaxWords(value, ANALYSIS_PROMPT_MAX_WORDS)),
});

export type SaveAnalysisInstructionsType = z.infer<
  typeof saveAnalysisInstructionsSchema
>;

export const assignFormUserSchema = z.object({
  formId: z.string().uuid(),
  userId: z.string().uuid(),
});

export type AssignFormUserType = z.infer<typeof assignFormUserSchema>;

export const unassignFormUserSchema = z.object({
  formId: z.string().uuid(),
  userId: z.string().uuid(),
});

export type UnassignFormUserType = z.infer<typeof unassignFormUserSchema>;
