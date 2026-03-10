import { pgSchema, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
  updatedAt: timestamp("created_at", { withTimezone: true }),
});
