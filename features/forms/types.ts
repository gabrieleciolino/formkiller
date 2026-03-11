import { getFormsQuery } from "@/features/forms/queries";

export type Form = Awaited<ReturnType<typeof getFormsQuery>>[0];
