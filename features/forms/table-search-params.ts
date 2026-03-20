import {
  inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const formTableLanguageValues = ["all", "en", "it", "es"] as const;
export const formTableTypeValues = [
  "all",
  "mixed",
  "default-only",
  "voice-only",
] as const;
export const formTableSortValues = ["created_at", "name"] as const;
export const tableDirectionValues = ["asc", "desc"] as const;

export const formTableSearchParamsParsers = {
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(""),
  language: parseAsStringLiteral(formTableLanguageValues).withDefault("all"),
  type: parseAsStringLiteral(formTableTypeValues).withDefault("all"),
  sort: parseAsStringLiteral(formTableSortValues).withDefault("created_at"),
  dir: parseAsStringLiteral(tableDirectionValues).withDefault("desc"),
};

export type FormTableSearchParams = inferParserType<
  typeof formTableSearchParamsParsers
>;
