import {
  inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const usersTableRoleValues = ["all", "admin", "user"] as const;
export const usersTableTierValues = ["all", "free", "pro"] as const;
export const usersTableSortValues = ["created_at", "username"] as const;
export const usersTableDirectionValues = ["asc", "desc"] as const;

export const usersTableSearchParamsParsers = {
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(""),
  role: parseAsStringLiteral(usersTableRoleValues).withDefault("all"),
  tier: parseAsStringLiteral(usersTableTierValues).withDefault("all"),
  sort: parseAsStringLiteral(usersTableSortValues).withDefault("created_at"),
  dir: parseAsStringLiteral(usersTableDirectionValues).withDefault("desc"),
};

export type UsersTableSearchParams = inferParserType<
  typeof usersTableSearchParamsParsers
>;
