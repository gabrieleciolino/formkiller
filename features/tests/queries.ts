import {
  TEST_ANSWERS_PER_QUESTION,
  TEST_CAROUSEL_SLIDES_COUNT,
  TEST_PROFILES_COUNT,
  testAnswerSchema,
  testSlideGenerationStatusSchema,
  testSlideKindSchema,
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

export type AdminTestSlide = {
  id: string;
  test_id: string;
  order: number;
  kind: "intro" | "question_1" | "question_2" | "cta";
  copy: string;
  image_prompt: string;
  image_file_key: string | null;
  generation_status: "idle" | "processing" | "completed" | "failed";
  generation_error: string | null;
};

export type AdminTestDetail = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  language: "en" | "it" | "es";
  status: "draft" | "published";
  background_image_key: string | null;
  background_music_key: string | null;
  intro_title: string | null;
  intro_message: string | null;
  end_title: string | null;
  end_message: string | null;
  profiles: AdminTestProfile[];
  questions: AdminTestQuestion[];
};

export type AdminTestSlidesDetail = {
  id: string;
  name: string;
  slug: string;
  language: "en" | "it" | "es";
  status: "draft" | "published";
  slides: AdminTestSlide[];
};

export type PublicTestViewerData = {
  id: string;
  slug: string;
  language: "en" | "it" | "es";
  name: string;
  backgroundImageUrl: string | null;
  backgroundMusicUrl: string | null;
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

const normalizeSlides = (slides: unknown): AdminTestSlide[] => {
  if (!Array.isArray(slides)) {
    return [];
  }

  return slides
    .filter(
      (slide): slide is Omit<AdminTestSlide, "kind" | "generation_status"> & {
        kind: unknown;
        generation_status: unknown;
      } =>
        Boolean(slide) &&
        typeof slide === "object" &&
        typeof (slide as { id?: unknown }).id === "string" &&
        typeof (slide as { test_id?: unknown }).test_id === "string" &&
        typeof (slide as { order?: unknown }).order === "number" &&
        typeof (slide as { copy?: unknown }).copy === "string" &&
        typeof (slide as { image_prompt?: unknown }).image_prompt === "string",
    )
    .map((slide) => {
      const parsedKind = testSlideKindSchema.safeParse(slide.kind);
      const parsedStatus = testSlideGenerationStatusSchema.safeParse(
        slide.generation_status,
      );

      return {
        ...slide,
        kind: parsedKind.success ? parsedKind.data : "intro",
        generation_status: parsedStatus.success ? parsedStatus.data : "idle",
        image_file_key:
          typeof slide.image_file_key === "string" ? slide.image_file_key : null,
        generation_error:
          typeof slide.generation_error === "string"
            ? slide.generation_error
            : null,
      };
    })
    .sort((a, b) => a.order - b.order)
    .slice(0, TEST_CAROUSEL_SLIDES_COUNT);
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
  const trace = startAdminTrace("tests.getAdminTestByIdQuery", { testId });
  let status = "ok";
  let profileCount = 0;
  let questionCount = 0;

  try {
    const [testResult, profilesResult, questionsResult] = await Promise.all([
      traceAdminStep(
        trace,
        "db.select.test",
        () =>
          supabase
            .from("test")
            .select(
              "id, user_id, name, slug, language, status, background_image_key, background_music_key, intro_title, intro_message, end_title, end_message",
            )
            .eq("id", testId)
            .maybeSingle(),
        { testId },
      ),
      traceAdminStep(
        trace,
        "db.select.test_profile",
        () =>
          supabase
            .from("test_profile")
            .select("id, test_id, title, description, order")
            .eq("test_id", testId)
            .order("order", { ascending: true }),
        { testId },
      ),
      traceAdminStep(
        trace,
        "db.select.test_question",
        () =>
          supabase
            .from("test_question")
            .select("id, test_id, question, answers, order, file_key")
            .eq("test_id", testId)
            .order("order", { ascending: true }),
        { testId },
      ),
    ]);

    if (testResult.error) {
      status = "error";
      throw testResult.error;
    }
    if (profilesResult.error) {
      status = "error";
      throw profilesResult.error;
    }
    if (questionsResult.error) {
      status = "error";
      throw questionsResult.error;
    }

    if (!testResult.data) {
      status = "not_found";
      return null;
    }

    const profiles = await traceAdminStep(trace, "normalize.profiles", () =>
      normalizeProfiles(profilesResult.data),
    );
    const questions = await traceAdminStep(trace, "normalize.questions", () =>
      normalizeQuestions(questionsResult.data),
    );

    profileCount = profiles.length;
    questionCount = questions.length;

    return {
      ...(testResult.data as Omit<AdminTestDetail, "profiles" | "questions">),
      profiles,
      questions,
    };
  } catch (error) {
    if (status === "ok") {
      status = "error";
    }
    throw error;
  } finally {
    endAdminTrace(trace, { status, profileCount, questionCount });
  }
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
      "id, slug, language, name, background_image_key, background_music_key, intro_title, intro_message, end_title, end_message, profiles:test_profile(id, test_id, title, description, order), questions:test_question(id, test_id, question, answers, order, file_key)",
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
    background_image_key: string | null;
    background_music_key: string | null;
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
    backgroundImageUrl: row.background_image_key,
    backgroundMusicUrl: row.background_music_key,
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

export async function getAdminTestSlidesByIdQuery({
  testId,
  supabase,
}: {
  testId: string;
  supabase: TypedSupabaseClient;
}): Promise<AdminTestSlidesDetail | null> {
  const [testResult, slidesResult] = await Promise.all([
    supabase
      .from("test")
      .select("id, name, slug, language, status")
      .eq("id", testId)
      .maybeSingle(),
    supabase
      .from("test_slide")
      .select(
        "id, test_id, order, kind, copy, image_prompt, image_file_key, generation_status, generation_error",
      )
      .eq("test_id", testId)
      .order("order", { ascending: true }),
  ]);

  if (testResult.error) {
    throw testResult.error;
  }

  if (slidesResult.error) {
    throw slidesResult.error;
  }

  if (!testResult.data) {
    return null;
  }

  return {
    ...(testResult.data as Omit<AdminTestSlidesDetail, "slides">),
    slides: normalizeSlides(slidesResult.data),
  };
}
