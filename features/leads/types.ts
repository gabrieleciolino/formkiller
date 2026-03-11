import { getLeadsQuery } from "@/features/leads/queries";

export type Lead = Awaited<ReturnType<typeof getLeadsQuery>>[0];
