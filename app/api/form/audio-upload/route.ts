import { uploadFile } from "@/lib/r2/functions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB

const requestSchema = z.object({
  formId: z.string().uuid(),
  sessionId: z.string().uuid(),
  questionId: z.string().uuid(),
});

function getExtensionFromMimeType(mimeType: string) {
  const subtype = mimeType.split("/")[1]?.trim().toLowerCase();
  if (!subtype) return "webm";

  const sanitizedSubtype = subtype.replace(/[^a-z0-9]/g, "");
  return sanitizedSubtype.length > 0 ? sanitizedSubtype : "webm";
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const file = formData.get("file");
  const parsedBody = requestSchema.safeParse({
    formId: formData.get("formId"),
    sessionId: formData.get("sessionId"),
    questionId: formData.get("questionId"),
  });

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("audio/")) {
    return NextResponse.json({ error: "Unsupported audio type" }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_AUDIO_SIZE) {
    return NextResponse.json({ error: "Audio file is too large" }, { status: 400 });
  }

  const { formId, sessionId, questionId } = parsedBody.data;

  const { data: session, error: sessionError } = await supabaseAdmin
    .from("form_session")
    .select("id, form_id, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json({ error: "Unable to validate session" }, { status: 500 });
  }

  if (!session || session.form_id !== formId || session.status === "completed") {
    return NextResponse.json({ error: "Invalid session/form association" }, { status: 400 });
  }

  const { data: question, error: questionError } = await supabaseAdmin
    .from("question")
    .select("id")
    .eq("id", questionId)
    .eq("form_id", formId)
    .maybeSingle();

  if (questionError) {
    return NextResponse.json({ error: "Unable to validate question" }, { status: 500 });
  }

  if (!question) {
    return NextResponse.json(
      { error: "Invalid question/form association" },
      { status: 400 },
    );
  }

  const ext = getExtensionFromMimeType(file.type);
  const fileKey = `stt/${formId}/${sessionId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await uploadFile({
    key: fileKey,
    body: buffer,
    contentType: file.type,
  });

  return NextResponse.json({
    fileKey,
    mimeType: file.type,
  });
}
