import { z } from "zod";

export const createLeadSchema = z.object({
  name: z.string(),
  email: z.email(),
  phone: z.string(),
  formId: z.string(),
});

export type CreateLeadType = z.infer<typeof createLeadSchema>;
