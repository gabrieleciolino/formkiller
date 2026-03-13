import {
  type EditableTestType,
  type GenerateTestDraftType,
  type SaveTestResultType,
} from "@/features/tests/schema";
import {
  getAdminTestByIdQuery,
  getAdminTestsQuery,
  getPublishedTestBySlugQuery,
} from "@/features/tests/queries";

export type AdminTest = Awaited<ReturnType<typeof getAdminTestsQuery>>[0];
export type AdminTestDetail = NonNullable<
  Awaited<ReturnType<typeof getAdminTestByIdQuery>>
>;
export type TestViewerData = NonNullable<
  Awaited<ReturnType<typeof getPublishedTestBySlugQuery>>
>;

export type GenerateTestDraftValues = GenerateTestDraftType;
export type EditableTestValues = EditableTestType;

export type TestEditorFormProps = {
  mode: "create" | "edit";
  initialData?: EditableTestValues;
  testId?: string;
};

export type TestProfilesFieldsProps = {
  values: EditableTestValues["profiles"];
  onChange: (next: EditableTestValues["profiles"]) => void;
  disabled?: boolean;
};

export type TestQuestionsFieldsProps = {
  values: EditableTestValues["questions"];
  onChange: (next: EditableTestValues["questions"]) => void;
  disabled?: boolean;
};

export type TestScoringGridProps = {
  questionIndex: number;
  answerIndex: number;
  scores: EditableTestValues["questions"][number]["answers"][number]["scores"];
  onChange: (
    next: EditableTestValues["questions"][number]["answers"][number]["scores"],
  ) => void;
  disabled?: boolean;
};

export type TestViewerProps = {
  test: TestViewerData;
};

export type SavePublicTestResultValues = SaveTestResultType;
