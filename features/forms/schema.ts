import { z } from "zod";

export const createFormSchema = z.object({
  name: z.string(),
  instructions: z.string(),
});

export type CreateFormType = z.infer<typeof createFormSchema>;

export const editFormSchema = z.object({
  formId: z.string(),
  name: z.string(),
  instructions: z.string(),
});

export type EditFormType = z.infer<typeof editFormSchema>;

export const editQuestionsSchema = z.object({
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
