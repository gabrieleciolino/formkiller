import { pgSchema, uuid } from "drizzle-orm/pg-core";

const authUserTable = pgSchema("auth").table("users", {
  id: uuid("id").primaryKey().defaultRandom(),
});
