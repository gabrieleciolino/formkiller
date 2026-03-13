"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { TestScoringGridProps } from "@/features/tests/types";
import { useTranslations } from "next-intl";

export default function TestScoringGrid({
  questionIndex,
  answerIndex,
  scores,
  onChange,
  disabled = false,
}: TestScoringGridProps) {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {scores.map((score, profileIndex) => (
        <Field key={profileIndex}>
          <FieldLabel>
            {t("tests.editor.scoring.profile", {
              profile: profileIndex + 1,
              question: questionIndex + 1,
              answer: answerIndex + 1,
            })}
          </FieldLabel>
          <Input
            type="number"
            min={0}
            max={10}
            step={1}
            value={score}
            disabled={disabled}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10);
              const nextScores = [...scores] as typeof scores;
              nextScores[profileIndex] = Number.isNaN(next)
                ? 0
                : Math.min(10, Math.max(0, next));
              onChange(nextScores);
            }}
          />
        </Field>
      ))}
    </div>
  );
}
