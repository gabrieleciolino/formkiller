import { z } from "zod";

export const accountRoleSchema = z.enum(["admin", "user"]);
export type AccountRole = z.infer<typeof accountRoleSchema>;

export const createUserSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(5),
  role: accountRoleSchema,
});

export type CreateUserType = z.infer<typeof createUserSchema>;
