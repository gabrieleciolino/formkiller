import TestViewer from "@/features/tests/components/test-viewer";
import { getPublishedTestBySlugQuery } from "@/features/tests/queries";
import { publicQuery } from "@/lib/queries";
import { getFileUrl } from "@/lib/r2/functions";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";

export default async function PublicTestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const test = await publicQuery(async ({ supabase }) =>
    getPublishedTestBySlugQuery({ slug, supabase }),
  );

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
    questions: test.questions.map((question) => ({
      ...question,
      audioUrl: question.audioUrl ? getFileUrl(question.audioUrl) : null,
    })),
  };

  return (
    <NextIntlClientProvider locale={test.language} messages={messages}>
      <TestViewer test={viewerData} />
    </NextIntlClientProvider>
  );
}
