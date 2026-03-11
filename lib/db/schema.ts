import {
  integer,
  jsonb,
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

export const formTable = pgTable("form", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUserTable.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  instructions: text("instructions").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const leadTable = pgTable("lead", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUserTable.id, { onDelete: "cascade" }),
  formId: uuid("form_id")
    .notNull()
    .references(() => formTable.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
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

  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});
