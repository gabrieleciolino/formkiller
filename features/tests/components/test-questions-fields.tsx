"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import TestScoringGrid from "@/features/tests/components/test-scoring-grid";
import { TEST_ANSWERS_PER_QUESTION } from "@/features/tests/schema";
import type { TestQuestionsFieldsProps } from "@/features/tests/types";
import { PlusIcon, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

const DEFAULT_SCORES: [number, number, number, number] = [0, 0, 0, 0];

function createEmptyQuestion(nextOrder: number) {
  return {
    id: crypto.randomUUID(),
    order: nextOrder,
    question: "",
    answers: Array.from({ length: TEST_ANSWERS_PER_QUESTION }).map((_, index) => ({
      answer: "",
      order: index,
      scores: [...DEFAULT_SCORES] as [number, number, number, number],
    })),
  };
}

export default function TestQuestionsFields({
  values,
  onChange,
  showScoring = true,
  disabled = false,
}: TestQuestionsFieldsProps) {
  const t = useTranslations();

  const handleAddQuestion = () => {
    const next = [...values, createEmptyQuestion(values.length)].map(
      (question, index) => ({
        ...question,
        order: index,
      }),
    );

    onChange(next);
  };

  const handleDeleteQuestion = (questionIndex: number) => {
    const next = values
      .filter((_, index) => index !== questionIndex)
      .map((question, index) => ({
        ...question,
        order: index,
      }));

    onChange(next);
  };

  return (
    <div className="space-y-4">
      {!disabled && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
            <PlusIcon className="size-4" />
            {t("tests.editor.questions.add")}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {values.map((question, questionIndex) => (
          <div key={question.id} className="space-y-4 rounded-md border border-border p-4">
            <div className="flex items-center gap-2">
              <Field className="flex-1">
                <FieldLabel>
                  {t("tests.editor.questions.label", {
                    index: questionIndex + 1,
                  })}
                </FieldLabel>
                <Input
                  value={question.question}
                  disabled={disabled}
                  onChange={(event) => {
                    const next = values.map((item, itemIndex) =>
                      itemIndex === questionIndex
                        ? {
                            ...item,
                            question: event.target.value,
                          }
                        : item,
                    );
                    onChange(next);
                  }}
                />
              </Field>

              {!disabled && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="mt-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDeleteQuestion(questionIndex)}
                  title={t("tests.editor.questions.delete")}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                {t("tests.editor.questions.answers")}
              </p>

              {question.answers.map((answer, answerIndex) => (
                <div key={answerIndex} className="space-y-2 rounded-md border border-border p-3">
                  <Field>
                    <FieldLabel>
                      {t("tests.editor.questions.answerLabel", {
                        index: answerIndex + 1,
                      })}
                    </FieldLabel>
                    <Input
                      value={answer.answer}
                      disabled={disabled}
                      onChange={(event) => {
                        const next = values.map((item, itemIndex) => {
                          if (itemIndex !== questionIndex) {
                            return item;
                          }

                          return {
                            ...item,
                            answers: item.answers.map((currentAnswer, currentAnswerIndex) =>
                              currentAnswerIndex === answerIndex
                                ? {
                                    ...currentAnswer,
                                    answer: event.target.value,
                                  }
                                : currentAnswer,
                            ),
                          };
                        });

                        onChange(next);
                      }}
                    />
                  </Field>

                  {showScoring ? (
                    <TestScoringGrid
                      questionIndex={questionIndex}
                      answerIndex={answerIndex}
                      scores={answer.scores}
                      disabled={disabled}
                      onChange={(nextScores) => {
                        const next = values.map((item, itemIndex) => {
                          if (itemIndex !== questionIndex) {
                            return item;
                          }

                          return {
                            ...item,
                            answers: item.answers.map((currentAnswer, currentAnswerIndex) =>
                              currentAnswerIndex === answerIndex
                                ? {
                                    ...currentAnswer,
                                    scores: nextScores,
                                  }
                                : currentAnswer,
                            ),
                          };
                        });

                        onChange(next);
                      }}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
