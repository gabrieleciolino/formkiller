import {
  inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const leadsTableSortValues = ["created_at", "name"] as const;
export const leadsTableDirectionValues = ["asc", "desc"] as const;

export const leadsTableSearchParamsParsers = {
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(leadsTableSortValues).withDefault("created_at"),
  dir: parseAsStringLiteral(leadsTableDirectionValues).withDefault("desc"),
};

export type LeadsTableSearchParams = inferParserType<
  typeof leadsTableSearchParamsParsers
>;
