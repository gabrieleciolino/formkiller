import {
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { GenerateFormType } from "@/lib/ai/types";

const authUserTable = pgSchema("auth").table("users", {
  id: uuid("id").primaryKey().defaultRandom(),
});

export const formTypeEnum = pgEnum("form_type", [
  "mixed",
  "default-only",
  "voice-only",
]);

export const formLanguageEnum = pgEnum("form_language", ["en", "it", "es"]);

export const formTable = pgTable("form", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUserTable.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  instructions: text("instructions").notNull(),
  type: formTypeEnum("type").notNull().default("mixed"),
  language: formLanguageEnum("language").notNull().default("en"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const leadTable = pgTable("lead", {
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
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const questionTable = pgTable("question", {
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
});

export const formSessionStatusEnum = pgEnum("form_session_status", [
  "pending",
  "in_progress",
  "completed",
]);

export const formSessionTable = pgTable("form_session", {
  id: uuid("id").primaryKey().defaultRandom(),
  // NB: questo è l'userId dell'utente che ha creato il questionario, non quello del visitatore che lo ha compilato
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
});

export const answerTable = pgTable("answer", {
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
});
