"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  assignUserToFormAction,
  unassignUserFromFormAction,
} from "@/features/forms/actions";
import FormEmbedDialog from "@/features/forms/components/form-embed-dialog";
import { urls } from "@/lib/urls";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type AssignableUser = {
  user_id: string;
  email: string | null;
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
  formName,
  users,
  assignments,
}: {
  formId: string;
  formName: string;
  users: AssignableUser[];
  assignments: FormAssignment[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeAssignmentsByUserId = useMemo(
    () =>
      new Map(
        assignments
          .filter((assignment) => assignment.active)
          .map((assignment) => [assignment.user_id, assignment.id] as const),
      ),
    [assignments],
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return users;

    return users.filter((user) => {
      const userIdMatch = user.user_id.toLowerCase().includes(normalizedQuery);
      const emailMatch = (user.email ?? "").toLowerCase().includes(normalizedQuery);

      return userIdMatch || emailMatch;
    });
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
            const assignmentId = activeAssignmentsByUserId.get(user.user_id);
            const isAssigned = Boolean(assignmentId);

            return (
              <div
                key={user.user_id}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-foreground">
                    {user.user_id}
                  </p>
                  {user.email ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {isAssigned
                      ? t("forms.assignments.assigned")
                      : t("forms.assignments.notAssigned")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {assignmentId ? (
                    <>
                      <Button asChild type="button" size="sm" variant="outline">
                        <Link
                          href={urls.form(assignmentId)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t("dashboard.forms.columns.open")}
                        </Link>
                      </Button>
                      <FormEmbedDialog assignmentId={assignmentId} formName={formName} />
                    </>
                  ) : null}
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
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
