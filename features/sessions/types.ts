import { getSessionsQuery } from "@/features/sessions/queries";

export type Session = Awaited<ReturnType<typeof getSessionsQuery>>[0];
