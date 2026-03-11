import { z } from "zod";

const PHONE_REGEX = /^\+?[\d\s\-(). ]{7,20}$/;

export const createLeadSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().regex(PHONE_REGEX),
  notes: z.string().optional(),
  formId: z.string(),
  sessionId: z.string(),
  userId: z.string(),
});

export type CreateLeadType = z.infer<typeof createLeadSchema>;

export function makeCreateLeadSchema(msgs: {
  minLength2: string;
  emailInvalid: string;
  phoneInvalid: string;
}) {
  return z.object({
    name: z.string().min(2, msgs.minLength2),
    email: z.email(msgs.emailInvalid),
    phone: z.string().regex(PHONE_REGEX, msgs.phoneInvalid),
    notes: z.string().optional(),
    formId: z.string(),
    sessionId: z.string(),
    userId: z.string(),
  });
}
