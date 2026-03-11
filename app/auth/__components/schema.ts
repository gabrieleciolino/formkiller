import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export type LoginFormType = z.infer<typeof loginFormSchema>;

export function makeLoginFormSchema(msgs: { required: string; emailInvalid: string }) {
  return z.object({
    email: z.email(msgs.emailInvalid),
    password: z.string().min(1, msgs.required),
  });
}
