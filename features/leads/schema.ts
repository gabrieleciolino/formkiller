import { z } from "zod";

const PHONE_REGEX = /^\+?[\d\s\-(). ]{7,20}$/;

export const createLeadSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().regex(PHONE_REGEX),
  notes: z.string().optional(),
  formId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

export type CreateLeadType = z.infer<typeof createLeadSchema>;
