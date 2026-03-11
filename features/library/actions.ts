"use server";

import { deleteAssetSchema } from "@/features/library/schema";
import { authenticatedActionClient } from "@/lib/actions";
import { deleteFile } from "@/lib/r2/functions";
import { urls } from "@/lib/urls";
import { revalidatePath } from "next/cache";

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
