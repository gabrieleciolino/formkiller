import { z } from "zod";

export const deleteAssetSchema = z.object({
  id: z.string().uuid(),
  fileKey: z.string(),
});

export const getAssetsForPickerSchema = z.object({
  type: z.enum(["image", "audio"]),
});
