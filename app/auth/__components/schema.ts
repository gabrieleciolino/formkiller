import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginFormType = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export type RegisterFormType = z.infer<typeof registerFormSchema>;
