"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  assignUserToFormAction,
  unassignUserFromFormAction,
} from "@/features/forms/actions";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type AssignableUser = {
  user_id: string;
  role: "admin" | "user";
  created_at: string | null;
};

type FormAssignment = {
  id: string;
  form_id: string;
  user_id: string;
  active: boolean;
  created_at: string | null;
};

export default function FormAssignmentsManager({
  formId,
  users,
  assignments,
}: {
  formId: string;
  users: AssignableUser[];
  assignments: FormAssignment[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeAssignedUserIds = useMemo(
    () =>
      new Set(
        assignments
          .filter((assignment) => assignment.active)
          .map((assignment) => assignment.user_id),
      ),
    [assignments],
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return users;

    return users.filter((user) =>
      user.user_id.toLowerCase().includes(normalizedQuery),
    );
  }, [query, users]);

  const handleToggle = (userId: string, isAssigned: boolean) => {
    startTransition(async () => {
      if (isAssigned) {
        await unassignUserFromFormAction({ formId, userId });
      } else {
        await assignUserToFormAction({ formId, userId });
      }

      router.refresh();
    });
  };

  return (
    <section className="space-y-3 rounded-lg border border-border p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">
          {t("forms.assignments.title")}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("forms.assignments.description")}
        </p>
      </div>

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("forms.assignments.searchPlaceholder")}
        disabled={isPending}
      />

      <div className="space-y-2">
        {filteredUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("forms.assignments.noUsers")}
          </p>
        ) : (
          filteredUsers.map((user) => {
            const isAssigned = activeAssignedUserIds.has(user.user_id);

            return (
              <div
                key={user.user_id}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-foreground">
                    {user.user_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAssigned
                      ? t("forms.assignments.assigned")
                      : t("forms.assignments.notAssigned")}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={isAssigned ? "outline" : "default"}
                  disabled={isPending}
                  onClick={() => handleToggle(user.user_id, isAssigned)}
                >
                  {isAssigned
                    ? t("forms.assignments.unassign")
                    : t("forms.assignments.assign")}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
