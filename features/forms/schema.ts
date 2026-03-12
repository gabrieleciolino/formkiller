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
