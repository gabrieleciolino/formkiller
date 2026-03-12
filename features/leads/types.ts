import { getAdminLeadsQuery, getUserLeadsQuery } from "@/features/leads/queries";

export type UserLead = Awaited<ReturnType<typeof getUserLeadsQuery>>[0];
export type AdminLead = Awaited<ReturnType<typeof getAdminLeadsQuery>>[0];
