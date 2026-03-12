import { getAdminFormsQuery, getUserFormsQuery } from "@/features/forms/queries";
import type {
  AddQuestionFormType,
  CreateFormType,
  EditQuestionsType,
  FormLanguage,
  FormTheme,
  FormType,
} from "@/features/forms/schema";
import type { CSSProperties } from "react";
import type { Control } from "react-hook-form";

export type DashboardForm = Awaited<ReturnType<typeof getUserFormsQuery>>[0];
export type AdminForm = Awaited<ReturnType<typeof getAdminFormsQuery>>[0];

export type AddQuestionFormValues = AddQuestionFormType;

export type AddQuestionSheetProps = {
  formId: string;
  nextOrder: number;
};

export type DeleteQuestionButtonProps = {
  questionId: string;
  formId: string;
};

export type DefaultAnswersFieldsProps = {
  control: Control<EditQuestionsType>;
  questionIndex: number;
  readOnly?: boolean;
};

export type QuestionTTSControlsProps = {
  questionId: string;
  formId: string;
  language: FormLanguage;
  initialFileUrl: string | null;
  readOnly?: boolean;
};

export type EditQuestionsFormProps = {
  questionsData: EditQuestionsType["questions"];
  formId?: string;
  language: FormLanguage;
  initialFileUrls?: Record<string, string | null>;
  mode?: "edit" | "create";
  onQuestionsChange?: (questions: NonNullable<CreateFormType["questions"]>) => void;
  readOnly?: boolean;
};

export type LibraryPickerAsset = {
  id: string;
  name: string;
  file_key: string;
  mime_type: string;
  type: "image" | "audio" | "video";
  size: number;
  url: string;
};

export type LibraryPickerDialogProps = {
  type: "image" | "audio";
  value: string | null;
  previewUrl: string | null;
  onChange: (key: string | null, previewUrl?: string | null) => void;
};

export type ViewerQuestion = {
  id: string;
  question: string;
  audioUrl: string | null;
  defaultAnswers: { answer: string; order: number }[];
};

export type ViewerFormData = {
  id: string;
  assignmentId: string;
  isLandingContactForm: boolean;
  name: string;
  userId: string;
  type: FormType;
  language: FormLanguage;
  theme: FormTheme;
  questions: ViewerQuestion[];
  backgroundImageUrl: string | null;
  backgroundMusicUrl: string | null;
  introTitle: string | null;
  introMessage: string | null;
  endTitle: string | null;
  endMessage: string | null;
};

export type FormViewerAnswerState =
  | { type: "default"; text: string }
  | { type: "custom"; blob: Blob }
  | null;

export type FormViewerRecordState = "idle" | "recording" | "done";
export type FormViewerPhase = "welcome" | "question" | "lead-form" | "completed";
export type FormViewerCompletionPayload = {
  analysisText: string | null;
  analysisAudioUrl: string | null;
};

export type RecordingButtonProps = {
  onStop: (wasAuto: boolean) => void;
};

export type LeadFormProps = {
  sessionId: string;
  formId: string;
  getTurnstileToken: () => Promise<string>;
  onCompleted: (payload: FormViewerCompletionPayload) => void;
  bgStyle: FormViewerBackgroundStyle;
  hasBackgroundImage: boolean;
  showLandingContactTechBackground: boolean;
  overlayClassName: string;
  isDark: boolean;
};

export type FormViewerProps = {
  form: ViewerFormData;
};

export type FormViewerThemeTokens = {
  bg: string;
  text: string;
  textSecondary: string;
  textHint: string;
  border: string;
  cardIdle: string;
  cardSelected: string;
  cta: string;
  ctaDisabled: string;
  cursor: string;
  progressActive: string;
  progressCurrent: string;
  progressInactive: string;
  progressText: string;
  muteBtn: string;
  overlay: string;
  recordIdle: string;
  recordHint: string;
  reRecord: string;
};

export type FormViewerBackgroundStyle = CSSProperties | undefined;

export type FormViewerWelcomePhaseProps = {
  bgStyle: FormViewerBackgroundStyle;
  formName: string;
  hasBackgroundImage: boolean;
  showLandingContactTechBackground: boolean;
  isDark: boolean;
  introTitle: string | null;
  introMessage: string | null;
  isPending: boolean;
  onStart: () => void;
  questionsCount: number;
  tk: FormViewerThemeTokens;
};

export type FormViewerCompletedPhaseProps = {
  bgStyle: FormViewerBackgroundStyle;
  endTitle: string | null;
  endMessage: string | null;
  analysisText: string | null;
  analysisAudioUrl: string | null;
  hasBackgroundImage: boolean;
  showLandingContactTechBackground: boolean;
  isDark: boolean;
  tk: FormViewerThemeTokens;
};

export type FormViewerQuestionPhaseProps = {
  answer: FormViewerAnswerState;
  autoStopped: boolean;
  bgStyle: FormViewerBackgroundStyle;
  currentIndex: number;
  displayedText: string;
  hasBackgroundImage: boolean;
  hasBackgroundMusic: boolean;
  showLandingContactTechBackground: boolean;
  isDark: boolean;
  isLast: boolean;
  isMuted: boolean;
  isPending: boolean;
  onAdvance: () => void;
  onResetRecording: () => void;
  onSelectDefault: (text: string) => void;
  onStartRecording: () => void;
  onStopRecording: (wasAuto?: boolean) => void;
  onToggleMute: () => void;
  questions: ViewerQuestion[];
  recordState: FormViewerRecordState;
  showDefaultAnswers: boolean;
  showRecording: boolean;
  tk: FormViewerThemeTokens;
};

export type EditFormSheetProps = {
  formData: AdminForm;
  backgroundImageUrl: string | null;
  backgroundMusicUrl: string | null;
};
