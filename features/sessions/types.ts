import {
  getAdminSessionsTableQuery,
  getUserSessionsTableQuery,
} from "@/features/sessions/queries";

export type UserSession = Awaited<
  ReturnType<typeof getUserSessionsTableQuery>
>["items"][number];
export type AdminSession = Awaited<
  ReturnType<typeof getAdminSessionsTableQuery>
>["items"][number];
