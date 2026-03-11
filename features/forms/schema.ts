import { z } from "zod";

export const formTypeSchema = z.enum(["mixed", "default-only", "voice-only"]);
export type FormType = z.infer<typeof formTypeSchema>;

export const FORM_TYPE_LABELS: Record<FormType, string> = {
  mixed: "Voice + buttons",
  "default-only": "Only buttons",
  "voice-only": "Only voice",
};

export const createFormSchema = z.object({
  name: z.string(),
  instructions: z.string(),
  type: formTypeSchema,
});

export type CreateFormType = z.infer<typeof createFormSchema>;

export const editFormSchema = z.object({
  formId: z.string(),
  name: z.string(),
  instructions: z.string(),
  type: formTypeSchema,
});

export type EditFormType = z.infer<typeof editFormSchema>;

export const editQuestionsSchema = z.object({
  formId: z.string(),
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

export const generateQuestionTTSSchema = z.object({
  questionId: z.string(),
  formId: z.string(),
});

export type GenerateQuestionTTSType = z.infer<typeof generateQuestionTTSSchema>;
