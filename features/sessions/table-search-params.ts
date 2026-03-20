import {
  inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const sessionsTableStatusValues = [
  "all",
  "pending",
  "in_progress",
  "abandoned",
  "completed",
] as const;
export const sessionsTableSortValues = ["created_at", "form"] as const;
export const sessionsTableDirectionValues = ["asc", "desc"] as const;

export const sessionsTableSearchParamsParsers = {
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(""),
  status: parseAsStringLiteral(sessionsTableStatusValues).withDefault("all"),
  sort: parseAsStringLiteral(sessionsTableSortValues).withDefault("created_at"),
  dir: parseAsStringLiteral(sessionsTableDirectionValues).withDefault("desc"),
};

export type SessionsTableSearchParams = inferParserType<
  typeof sessionsTableSearchParamsParsers
>;
