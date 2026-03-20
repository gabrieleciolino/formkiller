import { z } from "zod";

export const accountRoleSchema = z.enum(["admin", "user"]);
export type AccountRole = z.infer<typeof accountRoleSchema>;

export const accountTierSchema = z.enum(["free", "pro"]);
export type AccountTier = z.infer<typeof accountTierSchema>;

export const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/i);

export const createUserSchema = z.object({
  username: usernameSchema,
  email: z.string().trim().email(),
  password: z.string().min(5),
  role: accountRoleSchema,
  tier: accountTierSchema,
});

export type CreateUserType = z.infer<typeof createUserSchema>;

export const updateUserTierSchema = z.object({
  userId: z.string().uuid(),
  tier: accountTierSchema,
});

export type UpdateUserTierType = z.infer<typeof updateUserTierSchema>;
