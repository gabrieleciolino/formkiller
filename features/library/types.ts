import { getAssetsQuery } from "@/features/library/queries";

export type Asset = Awaited<ReturnType<typeof getAssetsQuery>>[0];
