import { getFileBuffer } from "@/lib/r2/functions";
import { createClient } from "@/lib/supabase/server";
import JSZip from "jszip";
import { NextResponse } from "next/server";
import { z } from "zod";

const REQUIRED_SLIDES_COUNT = 4;

const paramsSchema = z.object({
  testId: z.string().uuid(),
});

function sanitizeFilename(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

function getExtensionFromKey(key: string) {
  const lastSegment = key.split("/").pop() ?? key;
  const extension = lastSegment.split(".").pop()?.toLowerCase();
  return extension && extension.length > 0 ? extension : "png";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ testId: string }> },
) {
  const parsedParams = paramsSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid test id" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: account, error: accountError } = await supabase
    .from("account")
    .select("role")
    .eq("user_id", claimsData.claims.sub)
    .maybeSingle();

  if (accountError || account?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { testId } = parsedParams.data;
  const { data: test, error: testError } = await supabase
    .from("test")
    .select("id, slug, name")
    .eq("id", testId)
    .maybeSingle();

  if (testError) {
    return NextResponse.json({ error: "Unable to load test" }, { status: 500 });
  }

  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  const { data: slides, error: slidesError } = await supabase
    .from("test_slide")
    .select("order, image_file_key")
    .eq("test_id", testId)
    .order("order", { ascending: true });

  if (slidesError) {
    return NextResponse.json({ error: "Unable to load slides" }, { status: 500 });
  }

  const imageSlides = (slides ?? []).filter(
    (slide): slide is { order: number; image_file_key: string } =>
      typeof slide.image_file_key === "string" &&
      slide.image_file_key.trim().length > 0,
  );

  if (imageSlides.length < REQUIRED_SLIDES_COUNT) {
    return NextResponse.json(
      { error: "Generate all 4 slide images before downloading the ZIP" },
      { status: 400 },
    );
  }

  const zip = new JSZip();

  for (const slide of imageSlides) {
    const extension = getExtensionFromKey(slide.image_file_key);
    const filename = `slide-${slide.order + 1}.${extension}`;
    const fileBuffer = await getFileBuffer(slide.image_file_key);
    zip.file(filename, fileBuffer);
  }

  const zipBytes = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
  const zipBuffer = Buffer.from(zipBytes);

  const baseName = sanitizeFilename(test.slug || test.name || `test-${testId}`);
  const zipFilename = `${baseName || "test"}-slides.zip`;

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipFilename}"`,
      "Cache-Control": "no-store",
    },
  });
}
