import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/i);

export const loginFormSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginFormType = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z.object({
  username: usernameSchema,
  email: z.email(),
  password: z.string().min(6),
});

export type RegisterFormType = z.infer<typeof registerFormSchema>;
