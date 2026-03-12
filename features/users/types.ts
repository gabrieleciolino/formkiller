import { getAdminUsersQuery, getAssignableUsersQuery } from "@/features/users/queries";
import type { CreateUserType } from "@/features/users/schema";

export type AdminUser = Awaited<ReturnType<typeof getAdminUsersQuery>>[0];
export type AssignableUser = Awaited<ReturnType<typeof getAssignableUsersQuery>>[0];
export type CreateUserFormValues = CreateUserType;
