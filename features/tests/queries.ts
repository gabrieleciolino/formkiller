import {
  TEST_ANSWERS_PER_QUESTION,
  TEST_PROFILES_COUNT,
  testAnswerSchema,
} from "@/features/tests/schema";
import {
  endAdminTrace,
  startAdminTrace,
  traceAdminStep,
} from "@/lib/observability/admin-trace";
import { TypedSupabaseClient } from "@/lib/supabase/types";

export type AdminTestListItem = {
  id: string;
  name: string;
  slug: string;
  language: "en" | "it" | "es";
  status: "draft" | "published";
  created_at: string | null;
};

export type AdminTestProfile = {
  id: string;
  test_id: string;
  order: number;
  title: string;
  description: string;
};

export type AdminTestQuestion = {
  id: string;
  test_id: string;
  order: number;
  question: string;
  answers: Array<{
    answer: string;
    order: number;
    scores: [number, number, number, number];
  }>;
  file_key: string | null;
};

export type AdminTestDetail = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  language: "en" | "it" | "es";
  status: "draft" | "published";
  intro_title: string | null;
  intro_message: string | null;
  end_title: string | null;
  end_message: string | null;
  profiles: AdminTestProfile[];
  questions: AdminTestQuestion[];
};

export type PublicTestViewerData = {
  id: string;
  slug: string;
  language: "en" | "it" | "es";
  name: string;
  introTitle: string | null;
  introMessage: string | null;
  endTitle: string | null;
  endMessage: string | null;
  profiles: Array<{
    id: string;
    order: number;
    title: string;
    description: string;
  }>;
  questions: Array<{
    id: string;
    order: number;
    question: string;
    answers: Array<{
      answer: string;
      order: number;
      scores: [number, number, number, number];
    }>;
    audioUrl: string | null;
  }>;
};

const normalizeAnswers = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  const parsedAnswers: Array<{
    answer: string;
    order: number;
    scores: [number, number, number, number];
  }> = [];

  for (const answer of value) {
    const parsed = testAnswerSchema.safeParse(answer);
    if (parsed.success) {
      parsedAnswers.push(parsed.data);
    }
  }

  return parsedAnswers
    .sort((a, b) => a.order - b.order)
    .slice(0, TEST_ANSWERS_PER_QUESTION);
};

const normalizeProfiles = (profiles: unknown): AdminTestProfile[] => {
  if (!Array.isArray(profiles)) {
    return [];
  }

  return profiles
    .filter(
      (profile): profile is AdminTestProfile =>
        Boolean(profile) &&
        typeof profile === "object" &&
        typeof (profile as { id?: unknown }).id === "string" &&
        typeof (profile as { test_id?: unknown }).test_id === "string" &&
        typeof (profile as { order?: unknown }).order === "number" &&
        typeof (profile as { title?: unknown }).title === "string" &&
        typeof (profile as { description?: unknown }).description === "string",
    )
    .sort((a, b) => a.order - b.order)
    .slice(0, TEST_PROFILES_COUNT);
};

const normalizeQuestions = (questions: unknown): AdminTestQuestion[] => {
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions
    .filter(
      (question): question is Omit<AdminTestQuestion, "answers"> & { answers: unknown } =>
        Boolean(question) &&
        typeof question === "object" &&
        typeof (question as { id?: unknown }).id === "string" &&
        typeof (question as { test_id?: unknown }).test_id === "string" &&
        typeof (question as { order?: unknown }).order === "number" &&
        typeof (question as { question?: unknown }).question === "string",
    )
    .map((question) => ({
      ...question,
      answers: normalizeAnswers(question.answers),
      file_key:
        typeof question.file_key === "string" ? question.file_key : null,
    }))
    .sort((a, b) => a.order - b.order);
};

export async function getAdminTestsQuery({
  supabase,
}: {
  supabase: TypedSupabaseClient;
}): Promise<AdminTestListItem[]> {
  const trace = startAdminTrace("tests.getAdminTestsQuery");
  let rowCount = 0;
  let status = "ok";

  try {
    const { data, error } = await traceAdminStep(trace, "db.select.test", () =>
      supabase
        .from("test")
        .select("id, name, slug, language, status, created_at")
        .order("created_at", { ascending: false }),
    );

    if (error) {
      status = "error";
      throw error;
    }

    if (!Array.isArray(data)) {
      rowCount = 0;
      return [];
    }

    rowCount = data.length;
    return data as AdminTestListItem[];
  } finally {
    endAdminTrace(trace, { status, rowCount });
  }
}

export async function getAdminTestByIdQuery({
  testId,
  supabase,
}: {
  testId: string;
  supabase: TypedSupabaseClient;
}): Promise<AdminTestDetail | null> {
  const { data, error } = await supabase
    .from("test")
    .select(
      "id, user_id, name, slug, language, status, intro_title, intro_message, end_title, end_message, profiles:test_profile(id, test_id, title, description, order), questions:test_question(id, test_id, question, answers, order, file_key)",
    )
    .eq("id", testId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...(data as Omit<AdminTestDetail, "profiles" | "questions">),
    profiles: normalizeProfiles((data as { profiles?: unknown }).profiles),
    questions: normalizeQuestions((data as { questions?: unknown }).questions),
  };
}

export async function getPublishedTestBySlugQuery({
  slug,
  supabase,
}: {
  slug: string;
  supabase: TypedSupabaseClient;
}): Promise<PublicTestViewerData | null> {
  const { data, error } = await supabase
    .from("test")
    .select(
      "id, slug, language, name, intro_title, intro_message, end_title, end_message, profiles:test_profile(id, test_id, title, description, order), questions:test_question(id, test_id, question, answers, order, file_key)",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as {
    id: string;
    slug: string;
    language: "en" | "it" | "es";
    name: string;
    intro_title: string | null;
    intro_message: string | null;
    end_title: string | null;
    end_message: string | null;
    profiles?: unknown;
    questions?: unknown;
  };

  const profiles = normalizeProfiles(row.profiles);
  const questions = normalizeQuestions(row.questions);

  if (profiles.length !== TEST_PROFILES_COUNT || questions.length === 0) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    language: row.language,
    name: row.name,
    introTitle: row.intro_title,
    introMessage: row.intro_message,
    endTitle: row.end_title,
    endMessage: row.end_message,
    profiles: profiles.map((profile) => ({
      id: profile.id,
      order: profile.order,
      title: profile.title,
      description: profile.description,
    })),
    questions: questions.map((question) => ({
      id: question.id,
      order: question.order,
      question: question.question,
      answers: question.answers,
      audioUrl: question.file_key,
    })),
  };
}
