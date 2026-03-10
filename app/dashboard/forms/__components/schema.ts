import { z } from "zod";

export const createFormSchema = z.object({
  name: z.string(),
  instructions: z.string(),
});

export type CreateForm = z.infer<typeof createFormSchema>;
