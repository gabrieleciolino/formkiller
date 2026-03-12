import {
  getAdminSessionsQuery,
  getUserSessionsQuery,
} from "@/features/sessions/queries";

export type UserSession = Awaited<ReturnType<typeof getUserSessionsQuery>>[0];
export type AdminSession = Awaited<ReturnType<typeof getAdminSessionsQuery>>[0];
