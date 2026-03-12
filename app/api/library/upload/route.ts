import { uploadFile } from "@/lib/r2/functions";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const MIME_TO_TYPE: Record<string, "image" | "video" | "audio"> = {};
// populated via prefix matching below

function getAssetType(mimeType: string): "image" | "video" | "audio" | null {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return null;
}

// silence unused variable warning
void MIME_TO_TYPE;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();

  if (authError || !data?.claims?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = data.claims.sub;

  const { data: account, error: accountError } = await supabase
    .from("account")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (accountError || account?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 20MB." },
      { status: 400 },
    );
  }

  const assetType = getAssetType(file.type);
  if (!assetType) {
    return NextResponse.json(
      { error: "Unsupported file type. Only images, videos and audio are allowed." },
      { status: 400 },
    );
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const fileKey = `library/${userId}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await uploadFile({ key: fileKey, body: buffer, contentType: file.type });

  const { data: asset, error: dbError } = await supabase
    .from("asset")
    .insert({
      user_id: userId,
      name: file.name,
      file_key: fileKey,
      mime_type: file.type,
      size: file.size,
      type: assetType,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(asset);
}
