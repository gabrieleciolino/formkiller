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
