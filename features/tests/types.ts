import {
  type EditableTestSlideType,
  type EditableTestType,
  type GenerateTestCarouselDraftType,
  type GenerateTestDraftType,
  type SaveTestCarouselDraftType,
  type SaveTestResultType,
} from "@/features/tests/schema";
import {
  getAdminTestByIdQuery,
  getAdminTestSlidesByIdQuery,
  getAdminTestsQuery,
  getPublishedTestBySlugQuery,
} from "@/features/tests/queries";

export type AdminTest = Awaited<ReturnType<typeof getAdminTestsQuery>>[0];
export type AdminTestDetail = NonNullable<
  Awaited<ReturnType<typeof getAdminTestByIdQuery>>
>;
export type AdminTestSlidesDetail = NonNullable<
  Awaited<ReturnType<typeof getAdminTestSlidesByIdQuery>>
>;
export type TestViewerData = NonNullable<
  Awaited<ReturnType<typeof getPublishedTestBySlugQuery>>
>;

export type GenerateTestDraftValues = GenerateTestDraftType;
export type EditableTestValues = EditableTestType;
export type GenerateTestCarouselDraftValues = GenerateTestCarouselDraftType;
export type SaveTestCarouselDraftValues = SaveTestCarouselDraftType;
export type EditableTestSlideValues = EditableTestSlideType;

export type TestEditorFormProps = {
  mode: "create" | "edit";
  initialData?: EditableTestValues;
  testId?: string;
};

export type EditTestSheetProps = {
  testId: string;
  backgroundImageKey: string | null;
  backgroundMusicKey: string | null;
  backgroundImageUrl: string | null;
  backgroundMusicUrl: string | null;
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

export type TestViewerMessages = {
  testViewer: Record<string, unknown>;
};

export type TestViewerProps = {
  test: TestViewerData;
  locale: TestViewerData["language"];
  messages: TestViewerMessages;
};

export type SavePublicTestResultValues = SaveTestResultType;

export type TestCarouselSlideView = EditableTestSlideValues & {
  imageUrl: string | null;
};

export type TestSlidesEditorProps = {
  testId: string;
  initialSlides: TestCarouselSlideView[];
};
