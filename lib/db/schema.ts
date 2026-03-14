import { sql, type SQL } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgSchema,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
import { GenerateFormType } from "@/lib/ai/types";

type TestQuestionAnswer = {
  answer: string;
  order: number;
  scores: [number, number, number, number];
};

type TestResultAnswerSelection = {
  questionId: string;
  answerOrder: number;
  scores: [number, number, number, number];
};

const authUserTable = pgSchema("auth").table("users", {
  id: uuid("id").primaryKey().defaultRandom(),
});

export const accountRoleEnum = pgEnum("account_role", ["admin", "user"]);

const isAdminExpr = sql`
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
`;

const isOwnerExpr = (userIdCol: AnyPgColumn): SQL =>
  sql`${userIdCol} = auth.uid()`;

const isOwnerOrAdminExpr = (userIdCol: AnyPgColumn): SQL =>
  sql`${isOwnerExpr(userIdCol)} or ${isAdminExpr}`;

const ownsFormExpr = (formIdCol: AnyPgColumn): SQL => sql`
  exists (
    select 1
    from "form" f
    where f.id = ${formIdCol}
      and f.user_id = auth.uid()
  )
`;

const isPublishedTestExpr = (testIdCol: AnyPgColumn): SQL => sql`
  exists (
    select 1
    from "test" t
    where t.id = ${testIdCol}
      and t.status = 'published'
  )
`;

export const accountTable = pgTable(
  "account",
  {
    userId: uuid("user_id")
      .references(() => authUserTable.id, {
        onDelete: "cascade",
      })
      .primaryKey(),

    role: accountRoleEnum("role").notNull().default("user"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    pgPolicy("account_select_own", {
      for: "select",
      to: authenticatedRole,
      using: isOwnerExpr(t.userId),
    }),
    pgPolicy("account_insert_own_user", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${isOwnerExpr(t.userId)} and ${t.role} = 'user'`,
    }),
  ],
).enableRLS();

export const assetTypeEnum = pgEnum("asset_type", ["image", "video", "audio"]);
export const formThemeEnum = pgEnum("form_theme", ["light", "dark"]);

export const assetTable = pgTable(
  "asset",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUserTable.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    fileKey: text("file_key").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    type: assetTypeEnum("type").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    pgPolicy("asset_select_owner_or_admin", {
      for: "select",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
    pgPolicy("asset_insert_owner_or_admin", {
      for: "insert",
      to: authenticatedRole,
      withCheck: isOwnerOrAdminExpr(t.userId),
    }),
    pgPolicy("asset_update_owner_or_admin", {
      for: "update",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
      withCheck: isOwnerOrAdminExpr(t.userId),
    }),
    pgPolicy("asset_delete_owner_or_admin", {
      for: "delete",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
  ],
).enableRLS();

export const formTypeEnum = pgEnum("form_type", [
  "mixed",
  "default-only",
  "voice-only",
]);

export const formLanguageEnum = pgEnum("form_language", ["en", "it", "es"]);
export const testStatusEnum = pgEnum("test_status", ["draft", "published"]);

export const formTable = pgTable(
  "form",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUserTable.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    instructions: text("instructions").notNull(),
    type: formTypeEnum("type").notNull().default("mixed"),
    language: formLanguageEnum("language").notNull().default("en"),

    backgroundImageKey: text("background_image_key"),
    backgroundMusicKey: text("background_music_key"),
    theme: formThemeEnum("theme").notNull().default("dark"),
    introTitle: text("intro_title"),
    introMessage: text("intro_message"),
    endTitle: text("end_title"),
    endMessage: text("end_message"),
    analysisInstructions: text("analysis_instructions"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    pgPolicy("form_select_public", {
      for: "select",
      to: "public",
      using: sql`true`,
    }),
    pgPolicy("form_insert_owner_or_admin", {
      for: "insert",
      to: authenticatedRole,
      withCheck: isOwnerOrAdminExpr(t.userId),
    }),
    pgPolicy("form_update_owner_or_admin", {
      for: "update",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
      withCheck: isOwnerOrAdminExpr(t.userId),
    }),
    pgPolicy("form_delete_owner_or_admin", {
      for: "delete",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
  ],
).enableRLS();

export const formAssignmentTable = pgTable(
  "form_assignment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => formTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUserTable.id, { onDelete: "cascade" }),
    assignedBy: uuid("assigned_by")
      .notNull()
      .references(() => authUserTable.id, { onDelete: "cascade" }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    unique("form_assignment_form_user_unique").on(t.formId, t.userId),
    index("form_assignment_form_id_idx").on(t.formId),
    index("form_assignment_user_id_idx").on(t.userId),
    index("form_assignment_active_idx").on(t.active),
    pgPolicy("form_assignment_select_owner_or_admin", {
      for: "select",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
    pgPolicy("form_assignment_insert_admin", {
      for: "insert",
      to: authenticatedRole,
      withCheck: isAdminExpr,
    }),
    pgPolicy("form_assignment_update_admin", {
      for: "update",
      to: authenticatedRole,
      using: isAdminExpr,
      withCheck: isAdminExpr,
    }),
    pgPolicy("form_assignment_delete_admin", {
      for: "delete",
      to: authenticatedRole,
      using: isAdminExpr,
    }),
  ],
).enableRLS();

export const questionTable = pgTable(
  "question",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUserTable.id, { onDelete: "cascade" }),
    formId: uuid("form_id")
      .notNull()
      .references(() => formTable.id, { onDelete: "cascade" }),

    order: integer("order").notNull().default(0),
    question: text("question").notNull(),
    defaultAnswers: jsonb("default_answers").$type<GenerateFormType>().notNull(),

    fileKey: text("file_key"),
    fileGeneratedAt: timestamp("file_generated_at"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    pgPolicy("question_select_public", {
      for: "select",
      to: "public",
      using: sql`exists (select 1 from "form" f where f.id = ${t.formId})`,
    }),
    pgPolicy("question_insert_owner_or_admin", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`
        ${isAdminExpr}
        or (
          ${isOwnerExpr(t.userId)}
          and ${ownsFormExpr(t.formId)}
        )
      `,
    }),
    pgPolicy("question_update_owner_or_admin", {
      for: "update",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
      withCheck: sql`
        ${isAdminExpr}
        or (
          ${isOwnerExpr(t.userId)}
          and ${ownsFormExpr(t.formId)}
        )
      `,
    }),
    pgPolicy("question_delete_owner_or_admin", {
      for: "delete",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
  ],
).enableRLS();

export const formSessionStatusEnum = pgEnum("form_session_status", [
  "pending",
  "in_progress",
  "completed",
]);

export const formSessionTable = pgTable(
  "form_session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // NB: questo è l'userId dell'account a cui il form è assegnato
    userId: uuid("user_id")
      .notNull()
      .references(() => authUserTable.id, { onDelete: "cascade" }),
    formId: uuid("form_id")
      .notNull()
      .references(() => formTable.id, { onDelete: "cascade" }),

    status: formSessionStatusEnum("status").notNull().default("pending"),
    currentQuestionIndex: integer("current_question_index").notNull().default(0),
    completionAnalysisStatus: text("completion_analysis_status")
      .notNull()
      .default("idle"),
    completionAnalysisText: text("completion_analysis_text"),
    completionAnalysisAudioUrl: text("completion_analysis_audio_url"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    pgPolicy("form_session_select_owner_or_admin", {
      for: "select",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
    pgPolicy("form_session_delete_owner_or_admin", {
      for: "delete",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
  ],
).enableRLS();

export const leadTable = pgTable(
  "lead",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUserTable.id, { onDelete: "cascade" }),
    formId: uuid("form_id")
      .notNull()
      .references(() => formTable.id, { onDelete: "cascade" }),
    formSessionId: uuid("form_session_id")
      .notNull()
      .references(() => formSessionTable.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    pgPolicy("lead_select_owner_or_admin", {
      for: "select",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
    pgPolicy("lead_delete_owner_or_admin", {
      for: "delete",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
  ],
).enableRLS();

export const answerTable = pgTable(
  "answer",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // NB: questo è l'userId dell'utente che ha creato il questionario, non quello del visitatore che ha risposto
    userId: uuid("user_id")
      .notNull()
      .references(() => authUserTable.id, { onDelete: "cascade" }),
    formId: uuid("form_id")
      .notNull()
      .references(() => formTable.id, { onDelete: "cascade" }),
    formSessionId: uuid("form_session_id")
      .notNull()
      .references(() => formSessionTable.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questionTable.id, { onDelete: "cascade" }),

    // l'utente può rispondere o cliccando su una default answer oppure registrando la propria risposta customizzata
    defaultAnswer: text("default_answer"),
    fileKey: text("file_key"),
    fileGeneratedAt: timestamp("file_generated_at"),
    stt: text("stt"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    pgPolicy("answer_select_owner_or_admin", {
      for: "select",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
    pgPolicy("answer_delete_owner_or_admin", {
      for: "delete",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
  ],
).enableRLS();

export const testTable = pgTable(
  "test",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUserTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    language: formLanguageEnum("language").notNull().default("en"),
    status: testStatusEnum("status").notNull().default("draft"),
    backgroundImageKey: text("background_image_key"),
    backgroundMusicKey: text("background_music_key"),
    introTitle: text("intro_title"),
    introMessage: text("intro_message"),
    endTitle: text("end_title"),
    endMessage: text("end_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    unique("test_slug_unique").on(t.slug),
    index("test_user_id_idx").on(t.userId),
    index("test_status_idx").on(t.status),
    pgPolicy("test_select_public_or_admin", {
      for: "select",
      to: "public",
      using: sql`${isAdminExpr} or ${t.status} = 'published'`,
    }),
    pgPolicy("test_insert_admin", {
      for: "insert",
      to: authenticatedRole,
      withCheck: isAdminExpr,
    }),
    pgPolicy("test_update_admin", {
      for: "update",
      to: authenticatedRole,
      using: isAdminExpr,
      withCheck: isAdminExpr,
    }),
    pgPolicy("test_delete_admin", {
      for: "delete",
      to: authenticatedRole,
      using: isAdminExpr,
    }),
  ],
).enableRLS();

export const testQuestionTable = pgTable(
  "test_question",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    testId: uuid("test_id")
      .notNull()
      .references(() => testTable.id, { onDelete: "cascade" }),
    order: integer("order").notNull().default(0),
    question: text("question").notNull(),
    answers: jsonb("answers").$type<TestQuestionAnswer[]>().notNull(),
    fileKey: text("file_key"),
    fileGeneratedAt: timestamp("file_generated_at"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("test_question_test_id_idx").on(t.testId),
    index("test_question_test_id_order_idx").on(t.testId, t.order),
    pgPolicy("test_question_select_public_or_admin", {
      for: "select",
      to: "public",
      using: sql`${isAdminExpr} or ${isPublishedTestExpr(t.testId)}`,
    }),
    pgPolicy("test_question_insert_admin", {
      for: "insert",
      to: authenticatedRole,
      withCheck: isAdminExpr,
    }),
    pgPolicy("test_question_update_admin", {
      for: "update",
      to: authenticatedRole,
      using: isAdminExpr,
      withCheck: isAdminExpr,
    }),
    pgPolicy("test_question_delete_admin", {
      for: "delete",
      to: authenticatedRole,
      using: isAdminExpr,
    }),
  ],
).enableRLS();

export const testProfileTable = pgTable(
  "test_profile",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    testId: uuid("test_id")
      .notNull()
      .references(() => testTable.id, { onDelete: "cascade" }),
    order: integer("order").notNull().default(0),
    title: text("title").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("test_profile_test_id_idx").on(t.testId),
    index("test_profile_test_id_order_idx").on(t.testId, t.order),
    pgPolicy("test_profile_select_public_or_admin", {
      for: "select",
      to: "public",
      using: sql`${isAdminExpr} or ${isPublishedTestExpr(t.testId)}`,
    }),
    pgPolicy("test_profile_insert_admin", {
      for: "insert",
      to: authenticatedRole,
      withCheck: isAdminExpr,
    }),
    pgPolicy("test_profile_update_admin", {
      for: "update",
      to: authenticatedRole,
      using: isAdminExpr,
      withCheck: isAdminExpr,
    }),
    pgPolicy("test_profile_delete_admin", {
      for: "delete",
      to: authenticatedRole,
      using: isAdminExpr,
    }),
  ],
).enableRLS();

export const testResultTable = pgTable(
  "test_result",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    testId: uuid("test_id")
      .notNull()
      .references(() => testTable.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => testProfileTable.id, { onDelete: "cascade" }),
    language: formLanguageEnum("language").notNull().default("en"),
    scoreTotals: jsonb("score_totals").$type<number[]>().notNull(),
    answerSelections: jsonb("answer_selections")
      .$type<TestResultAnswerSelection[]>()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("test_result_test_id_idx").on(t.testId),
    index("test_result_profile_id_idx").on(t.profileId),
    index("test_result_created_at_idx").on(t.createdAt),
    pgPolicy("test_result_select_admin", {
      for: "select",
      to: authenticatedRole,
      using: isAdminExpr,
    }),
    pgPolicy("test_result_insert_public", {
      for: "insert",
      to: "public",
      withCheck: sql`
        ${isPublishedTestExpr(t.testId)}
        and exists (
          select 1
          from "test_profile" p
          where p.id = ${t.profileId}
            and p.test_id = ${t.testId}
        )
      `,
    }),
    pgPolicy("test_result_delete_admin", {
      for: "delete",
      to: authenticatedRole,
      using: isAdminExpr,
    }),
  ],
).enableRLS();
