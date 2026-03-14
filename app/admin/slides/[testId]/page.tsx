import { Button } from "@/components/ui/button";
import TestSlidesEditor from "@/features/tests/components/test-slides-editor";
import { TEST_CAROUSEL_SLIDE_DEFINITIONS } from "@/features/tests/schema";
import { getAdminTestSlidesByIdQuery } from "@/features/tests/queries";
import { adminQuery } from "@/lib/queries";
import { getFileUrl } from "@/lib/r2/functions";
import { urls } from "@/lib/urls";
import { Download, ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";

function serializePageError(error: unknown) {
  if (error instanceof Error) {
    const candidate = error as Error & {
      cause?: unknown;
      digest?: string;
      statusCode?: number;
      code?: string;
      details?: unknown;
    };

    return {
      name: candidate.name,
      message: candidate.message,
      stack: candidate.stack,
      digest: candidate.digest,
      statusCode: candidate.statusCode,
      code: candidate.code,
      details: candidate.details,
      cause:
        candidate.cause instanceof Error
          ? {
              name: candidate.cause.name,
              message: candidate.cause.message,
              stack: candidate.cause.stack,
            }
          : candidate.cause,
    };
  }

  return {
    value: String(error),
  };
}

export default async function AdminSlidesDetailPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;

  let test;
  let t;
  try {
    [test, t] = await Promise.all([
      adminQuery(async ({ supabase }) =>
        getAdminTestSlidesByIdQuery({ testId, supabase }),
      ),
      getTranslations(),
    ]);
  } catch (error) {
    console.error("[admin_slides_detail_page_error]", {
      testId,
      ...serializePageError(error),
    });
    throw error;
  }

  if (!test) {
    notFound();
  }

  const slidesByOrder = new Map(test.slides.map((slide) => [slide.order, slide]));
  const initialSlides = TEST_CAROUSEL_SLIDE_DEFINITIONS.map(({ order, kind }) => {
    const slide = slidesByOrder.get(order);

    return {
      order,
      kind,
      copy: slide?.copy ?? "",
      imagePrompt: slide?.image_prompt ?? "",
      generationStatus: slide?.generation_status ?? "idle",
      generationError: slide?.generation_error ?? null,
      imageFileKey: slide?.image_file_key ?? null,
      imageUrl: slide?.image_file_key ? getFileUrl(slide.image_file_key) : null,
    };
  });
  const canDownloadZip = initialSlides.every((slide) => Boolean(slide.imageFileKey));
  const downloadZipHref = `/api/admin/slides/${test.id}/zip`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">{test.name}</h2>
          <p className="text-sm text-muted-foreground">/{test.slug}</p>
        </div>

        <div className="flex items-center gap-2">
          {canDownloadZip ? (
            <Button asChild variant="outline" size="sm">
              <Link href={downloadZipHref} prefetch={false}>
                <Download className="size-4" />
                {t("dashboard.slides.downloadZip")}
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
              title={t("dashboard.slides.downloadZipDisabled")}
            >
              <Download className="size-4" />
              {t("dashboard.slides.downloadZip")}
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href={urls.admin.slides.index}>
              {t("dashboard.slides.back")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={urls.test(test.slug)} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              {t("dashboard.tests.columns.open")}
            </Link>
          </Button>
        </div>
      </div>

      <TestSlidesEditor testId={test.id} initialSlides={initialSlides} />
    </div>
  );
}
