import { z } from "zod";

export const createLeadSchema = z.object({
  name: z.string().min(2, "Il nome deve contenere almeno 2 caratteri"),
  email: z.email("Inserisci un indirizzo email valido"),
  phone: z
    .string()
    .regex(
      /^\+?[\d\s\-(). ]{7,20}$/,
      "Inserisci un numero di telefono valido",
    ),
  notes: z.string().optional(),
  formId: z.string(),
  sessionId: z.string(),
  userId: z.string(),
});

export type CreateLeadType = z.infer<typeof createLeadSchema>;
