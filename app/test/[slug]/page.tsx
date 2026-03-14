import TestViewer from "@/features/tests/components/test-viewer";
import { getPublishedTestBySlugQuery } from "@/features/tests/queries";
import { publicQuery } from "@/lib/queries";
import { getFileUrl } from "@/lib/r2/functions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

const getPublicTestBySlug = cache(async (slug: string) =>
  publicQuery(async ({ supabase }) => getPublishedTestBySlugQuery({ slug, supabase })),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const test = await getPublicTestBySlug(slug);

  return {
    title: test?.name ?? undefined,
    openGraph: {
      title: test?.name ?? undefined,
      images: [{ url: "/ogimage-seituilproblema.png" }],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/ogimage-seituilproblema.png"],
    },
  };
}

export default async function PublicTestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const test = await getPublicTestBySlug(slug);

  if (!test) {
    notFound();
  }

  const allMessages = (await import(`@/messages/${test.language}.json`)).default as {
    testViewer?: Record<string, unknown>;
  };

  const messages = {
    testViewer: allMessages.testViewer ?? {},
  };

  const viewerData = {
    ...test,
    backgroundImageUrl: test.backgroundImageUrl
      ? getFileUrl(test.backgroundImageUrl)
      : null,
    backgroundMusicUrl: test.backgroundMusicUrl
      ? getFileUrl(test.backgroundMusicUrl)
      : null,
    questions: test.questions.map((question) => ({
      ...question,
      audioUrl: question.audioUrl ? getFileUrl(question.audioUrl) : null,
    })),
  };

  return <TestViewer test={viewerData} locale={test.language} messages={messages} />;
}
