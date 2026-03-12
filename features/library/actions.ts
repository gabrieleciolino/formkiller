"use server";

import { deleteAssetSchema, getAssetsForPickerSchema } from "@/features/library/schema";
import { adminActionClient } from "@/lib/actions";
import { deleteFile, getFileUrl } from "@/lib/r2/functions";
import { urls } from "@/lib/urls";
import { revalidatePath } from "next/cache";

export const getAssetsForPickerAction = adminActionClient
  .inputSchema(getAssetsForPickerSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { type } = parsedInput;

    const { data, error } = await supabase
      .from("asset")
      .select("id, name, file_key, mime_type, type, size")
      .eq("type", type)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((asset) => ({
      ...asset,
      url: getFileUrl(asset.file_key),
    }));
  });

export const deleteAssetAction = adminActionClient
  .inputSchema(deleteAssetSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { id, fileKey } = parsedInput;

    const { error } = await supabase.from("asset").delete().eq("id", id);

    if (error) throw error;

    await deleteFile(fileKey);

    revalidatePath(urls.admin.library.index);
  });
