"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usersTableRoleValues,
  usersTableSearchParamsParsers,
  usersTableSortValues,
  usersTableTierValues,
} from "@/features/users/table-search-params";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { useQueryStates } from "nuqs";

type UsersTableControlsProps = {
  page: number;
  totalPages: number;
  total: number;
};

export default function UsersTableControls({
  page,
  totalPages,
  total,
}: UsersTableControlsProps) {
  const t = useTranslations();
  const [query, setQuery] = useQueryStates(usersTableSearchParamsParsers, {
    shallow: false,
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const applySearch = () => {
    void setQuery({
      q: searchInputRef.current?.value ?? "",
      page: 1,
    });
  };

  const clearAll = () => {
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    void setQuery({
      q: "",
      role: "all",
      tier: "all",
      sort: "created_at",
      dir: "desc",
      page: 1,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          key={`users-search-${query.q}`}
          defaultValue={query.q}
          ref={searchInputRef}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              applySearch();
            }
          }}
          placeholder={t("dashboard.users.search.placeholder")}
          className="w-full md:w-[280px]"
        />
        <Button type="button" variant="outline" onClick={applySearch}>
          {t("dashboard.table.search")}
        </Button>
        <Button type="button" variant="ghost" onClick={clearAll}>
          {t("dashboard.table.clear")}
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {t("dashboard.users.columns.role")}
          </p>
          <Select
            value={query.role}
            onValueChange={(value) =>
              void setQuery({
                role: value as (typeof usersTableRoleValues)[number],
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {usersTableRoleValues.map((value) => (
                <SelectItem key={value} value={value}>
                  {value === "all"
                    ? t("dashboard.table.all")
                    : t(`dashboard.users.roles.${value}` as Parameters<typeof t>[0])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {t("dashboard.users.columns.tier")}
          </p>
          <Select
            value={query.tier}
            onValueChange={(value) =>
              void setQuery({
                tier: value as (typeof usersTableTierValues)[number],
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {usersTableTierValues.map((value) => (
                <SelectItem key={value} value={value}>
                  {value === "all"
                    ? t("dashboard.table.all")
                    : t(`dashboard.users.tiers.${value}` as Parameters<typeof t>[0])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t("dashboard.table.sortBy")}</p>
          <Select
            value={query.sort}
            onValueChange={(value) =>
              void setQuery({
                sort: value as (typeof usersTableSortValues)[number],
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">
                {t("dashboard.users.columns.createdAt")}
              </SelectItem>
              <SelectItem value="username">
                {t("dashboard.users.columns.username")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {t("dashboard.table.direction.label")}
          </p>
          <Select
            value={query.dir}
            onValueChange={(value) =>
              void setQuery({
                dir: value as "asc" | "desc",
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">{t("dashboard.table.direction.desc")}</SelectItem>
              <SelectItem value="asc">{t("dashboard.table.direction.asc")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{t("dashboard.table.results", { count: total })}</span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canGoPrev}
            onClick={() => void setQuery({ page: Math.max(1, page - 1) })}
          >
            {t("dashboard.table.previous")}
          </Button>
          <span>{t("dashboard.table.page", { page, totalPages })}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canGoNext}
            onClick={() => void setQuery({ page: page + 1 })}
          >
            {t("dashboard.table.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
