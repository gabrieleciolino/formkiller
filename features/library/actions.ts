"use server";

import { deleteAssetSchema, getAssetsForPickerSchema } from "@/features/library/schema";
import { authenticatedActionClient } from "@/lib/actions";
import { deleteFile, getFileUrl } from "@/lib/r2/functions";
import { urls } from "@/lib/urls";
import { revalidatePath } from "next/cache";

export const getAssetsForPickerAction = authenticatedActionClient
  .inputSchema(getAssetsForPickerSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;
    const { type } = parsedInput;

    const { data, error } = await supabase
      .from("asset")
      .select("id, name, file_key, mime_type, type, size")
      .eq("user_id", userId)
      .eq("type", type)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((asset) => ({
      ...asset,
      url: getFileUrl(asset.file_key),
    }));
  });

export const deleteAssetAction = authenticatedActionClient
  .inputSchema(deleteAssetSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;
    const { id, fileKey } = parsedInput;

    const { error } = await supabase
      .from("asset")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    await deleteFile(fileKey);

    revalidatePath(urls.dashboard.library.index);
  });
