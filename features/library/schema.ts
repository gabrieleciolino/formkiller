import { z } from "zod";

export const deleteAssetSchema = z.object({
  id: z.string().uuid(),
  fileKey: z.string(),
});
