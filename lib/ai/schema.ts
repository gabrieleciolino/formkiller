import z from "zod";

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
