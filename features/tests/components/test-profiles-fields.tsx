"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TestProfilesFieldsProps } from "@/features/tests/types";
import { useTranslations } from "next-intl";

export default function TestProfilesFields({
  values,
  onChange,
  disabled = false,
}: TestProfilesFieldsProps) {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {values.map((profile, profileIndex) => (
        <div key={profile.id} className="space-y-3 rounded-md border border-border p-4">
          <p className="text-sm font-semibold text-foreground">
            {t("tests.editor.profiles.profileTitle", { index: profileIndex + 1 })}
          </p>
          <Field>
            <FieldLabel>{t("tests.editor.profiles.title")}</FieldLabel>
            <Input
              value={profile.title}
              disabled={disabled}
              onChange={(event) => {
                const next = values.map((item, itemIndex) =>
                  itemIndex === profileIndex
                    ? { ...item, title: event.target.value }
                    : item,
                );
                onChange(next);
              }}
            />
          </Field>
          <Field>
            <FieldLabel>{t("tests.editor.profiles.description")}</FieldLabel>
            <Textarea
              rows={4}
              value={profile.description}
              disabled={disabled}
              onChange={(event) => {
                const next = values.map((item, itemIndex) =>
                  itemIndex === profileIndex
                    ? { ...item, description: event.target.value }
                    : item,
                );
                onChange(next);
              }}
            />
          </Field>
        </div>
      ))}
    </div>
  );
}
