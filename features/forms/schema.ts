import { z } from "zod";

export const formTypeSchema = z.enum(["mixed", "default-only", "voice-only"]);
export type FormType = z.infer<typeof formTypeSchema>;

export const FORM_TYPE_LABELS: Record<FormType, string> = {
  mixed: "Voice + buttons",
  "default-only": "Only buttons",
  "voice-only": "Only voice",
};

export const formLanguageSchema = z.enum(["en", "it", "es"]);
export type FormLanguage = z.infer<typeof formLanguageSchema>;

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
});

export type CreateFormType = z.infer<typeof createFormSchema>;

export const formThemeSchema = z.enum(["light", "dark"]);
export type FormTheme = z.infer<typeof formThemeSchema>;

export const editFormSchema = z.object({
  formId: z.string(),
  name: z.string(),
  instructions: z.string(),
  type: formTypeSchema,
  theme: formThemeSchema,
  backgroundImageKey: z.string().nullable().optional(),
  backgroundMusicKey: z.string().nullable().optional(),
});

export type EditFormType = z.infer<typeof editFormSchema>;

export const editQuestionsSchema = z.object({
  formId: z.string(),
  language: z.string(),
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      order: z.number(),
      default_answers: z.array(
        z.object({
          answer: z.string(),
          order: z.number(),
        }),
      ),
    }),
  ),
});

export type EditQuestionsType = z.infer<typeof editQuestionsSchema>;

export const addQuestionSchema = z.object({
  formId: z.string(),
  order: z.number(),
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
  questionId: z.string(),
  formId: z.string(),
});

export type DeleteQuestionType = z.infer<typeof deleteQuestionSchema>;

export const deleteFormSchema = z.object({
  formId: z.string(),
});

export type DeleteFormType = z.infer<typeof deleteFormSchema>;

export const generateQuestionTTSSchema = z.object({
  questionId: z.string(),
  formId: z.string(),
  language: z.string(),
});

export type GenerateQuestionTTSType = z.infer<typeof generateQuestionTTSSchema>;
