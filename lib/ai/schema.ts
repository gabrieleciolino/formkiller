import z from "zod";

export const generateFormSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        order: z.number().describe("Integer. Position of the question"),
        defaultAnswers: z
          .array(
            z.object({
              answer: z.string(),
              order: z.number().describe("Interger. Position of the answer"),
            }),
          )
          .length(4),
      }),
    )
    .min(5)
    .max(10),
});
