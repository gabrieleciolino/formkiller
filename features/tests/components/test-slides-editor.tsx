"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  generateTestCarouselDraftAction,
  saveTestCarouselDraftAction,
  triggerTestCarouselGenerationAction,
} from "@/features/tests/actions";
import {
  TEST_CAROUSEL_SLIDE_COPY_MAX_CHARS,
  TEST_CAROUSEL_SLIDE_DEFINITIONS,
  TEST_CAROUSEL_SLIDE_PROMPT_MAX_CHARS,
} from "@/features/tests/schema";
import type { TestCarouselSlideView, TestSlidesEditorProps } from "@/features/tests/types";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useState } from "react";

const statusClassMap: Record<string, string> = {
  idle: "border-border bg-muted text-muted-foreground",
  processing: "border-border bg-muted text-foreground",
  completed: "border-border bg-muted text-foreground",
  failed: "border-border bg-muted text-foreground",
};

const slideTitleKeyByKind: Record<
  TestCarouselSlideView["kind"],
  `tests.carousel.slides.${string}`
> = {
  intro: "tests.carousel.slides.intro",
  question_1: "tests.carousel.slides.question1",
  question_2: "tests.carousel.slides.question2",
  cta: "tests.carousel.slides.cta",
};

const normalizeSlides = (
  slides: TestCarouselSlideView[],
): TestCarouselSlideView[] => {
  const byOrder = new Map(slides.map((slide) => [slide.order, slide]));

  return TEST_CAROUSEL_SLIDE_DEFINITIONS.map(({ order, kind }) => {
    const slide = byOrder.get(order);

    return {
      order,
      kind,
      copy: slide?.copy ?? "",
      imagePrompt: slide?.imagePrompt ?? "",
      generationStatus: slide?.generationStatus ?? "idle",
      generationError: slide?.generationError ?? null,
      imageFileKey: slide?.imageFileKey ?? null,
      imageUrl: slide?.imageUrl ?? null,
    };
  });
};

export default function TestSlidesEditor({
  testId,
  initialSlides,
}: TestSlidesEditorProps) {
  const t = useTranslations();
  const router = useRouter();
  const [slides, setSlides] = useState<TestCarouselSlideView[]>(
    normalizeSlides(initialSlides),
  );
  const [isGeneratingDraft, startGeneratingDraft] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [isQueueingGeneration, startQueueingGeneration] = useTransition();
  const [queueingSlideOrder, setQueueingSlideOrder] = useState<number | null>(
    null,
  );

  useEffect(() => {
    setSlides(normalizeSlides(initialSlides));
  }, [initialSlides]);

  const updateSlide = (
    order: number,
    field: "copy" | "imagePrompt",
    value: string,
  ) => {
    setSlides((prev) =>
      prev.map((slide) =>
        slide.order === order ? { ...slide, [field]: value } : slide,
      ),
    );
  };

  const handleGenerateDraft = () => {
    startGeneratingDraft(async () => {
      try {
        const { data, serverError, validationErrors } =
          await generateTestCarouselDraftAction({
            testId,
          });

        if (serverError || validationErrors || !data) {
          throw new Error(serverError ?? "Draft generation failed");
        }

        const nextSlides = normalizeSlides(
          data.slides.map((slide) => ({
            ...slide,
            imageUrl: null,
          })),
        );
        setSlides(nextSlides);
        toast(t("tests.carousel.generateDraftSuccess"));
      } catch {
        toast(t("tests.carousel.generateDraftError"));
      }
    });
  };

  const handleSaveDraft = () => {
    startSaving(async () => {
      try {
        const { data, serverError, validationErrors } =
          await saveTestCarouselDraftAction({
            testId,
            slides: slides.map((slide) => ({
              order: slide.order,
              kind: slide.kind,
              copy: slide.copy,
              imagePrompt: slide.imagePrompt,
            })),
          });

        if (serverError || validationErrors || !data) {
          throw new Error(serverError ?? "Save failed");
        }

        setSlides(
          normalizeSlides(
            data.slides.map((slide) => ({
              ...slide,
              imageUrl: null,
            })),
          ),
        );
        toast(t("tests.carousel.saveSuccess"));
      } catch {
        toast(t("tests.carousel.saveError"));
      }
    });
  };

  const handleTriggerGeneration = (slideOrder: number) => {
    const slide = slides.find((candidate) => candidate.order === slideOrder);
    if (!slide) {
      toast(t("tests.carousel.triggerError"));
      return;
    }

    if (slide.copy.trim().length === 0 || slide.imagePrompt.trim().length === 0) {
      toast(t("tests.carousel.missingSlideContent"));
      return;
    }

    startQueueingGeneration(async () => {
      setQueueingSlideOrder(slideOrder);
      try {
        const { data, serverError, validationErrors } =
          await triggerTestCarouselGenerationAction({
            testId,
            slideOrder,
            copy: slide.copy,
            imagePrompt: slide.imagePrompt,
          });

        if (serverError || validationErrors || !data) {
          if (typeof serverError === "string") {
            if (serverError.includes("Generate slide 1 image")) {
              toast(t("tests.carousel.firstSlideRequired"));
              return;
            }

            if (
              serverError.includes("Slide copy and image prompt are required") ||
              serverError.includes("Missing")
            ) {
              toast(t("tests.carousel.missingSlideContent"));
              return;
            }
          }

          throw new Error(serverError ?? "Trigger failed");
        }

        setSlides((prev) =>
          prev.map((slide) => ({
            ...slide,
            generationStatus:
              slide.order === slideOrder
                ? "processing"
                : slide.generationStatus ?? "idle",
            generationError: slide.order === slideOrder ? null : slide.generationError,
          })),
        );
        toast(t("tests.carousel.triggerSuccess"));
        router.refresh();
      } catch {
        toast(t("tests.carousel.triggerError"));
      } finally {
        setQueueingSlideOrder(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={handleGenerateDraft}
          disabled={isGeneratingDraft}
        >
          {isGeneratingDraft
            ? t("tests.carousel.generatingDraft")
            : t("tests.carousel.generateDraft")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleSaveDraft}
          disabled={isSaving}
        >
          {isSaving ? t("tests.carousel.saving") : t("tests.carousel.save")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {slides.map((slide) => (
          <section key={slide.order} className="space-y-3 rounded-md border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground">
                {t(slideTitleKeyByKind[slide.kind] as Parameters<typeof t>[0])}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${statusClassMap[slide.generationStatus ?? "idle"]}`}
                >
                  {t(
                    `tests.carousel.status.${slide.generationStatus ?? "idle"}` as Parameters<
                      typeof t
                    >[0],
                  )}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleTriggerGeneration(slide.order)}
                  disabled={isQueueingGeneration}
                >
                  {isQueueingGeneration && queueingSlideOrder === slide.order
                    ? t(
                        slide.imageFileKey || slide.imageUrl
                          ? "tests.carousel.regeneratingSlide"
                          : "tests.carousel.triggeringSlide",
                      )
                    : t(
                        slide.imageFileKey || slide.imageUrl
                          ? "tests.carousel.regenerateSlide"
                          : "tests.carousel.triggerSlide",
                      )}
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {t("tests.carousel.copyLabel")}
              </p>
              <Textarea
                value={slide.copy}
                onChange={(event) =>
                  updateSlide(slide.order, "copy", event.target.value)
                }
                rows={7}
                maxLength={TEST_CAROUSEL_SLIDE_COPY_MAX_CHARS}
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {t("tests.carousel.promptLabel")}
              </p>
              <Textarea
                value={slide.imagePrompt}
                onChange={(event) =>
                  updateSlide(slide.order, "imagePrompt", event.target.value)
                }
                rows={8}
                maxLength={TEST_CAROUSEL_SLIDE_PROMPT_MAX_CHARS}
              />
            </div>

            {slide.generationError ? (
              <p className="text-sm text-destructive">{slide.generationError}</p>
            ) : null}

            {slide.imageUrl ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {t("tests.carousel.previewLabel")}
                </p>
                <div className="overflow-hidden rounded-md border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.imageUrl}
                    alt={t("tests.carousel.previewAlt", { index: slide.order + 1 })}
                    className="h-auto w-full"
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("tests.carousel.noImage")}
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
