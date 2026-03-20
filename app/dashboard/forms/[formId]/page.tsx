import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import { Separator } from "@/components/ui/separator";
import { canUseProFeatures } from "@/lib/account";
import ChangeFormVoiceSheet from "@/features/forms/components/change-form-voice-sheet";
import EditFormSheet from "@/features/forms/components/edit-form-sheet";
import EditQuestionsForm from "@/features/forms/components/edit-questions-form";
import GenerateAnalysisSheet from "@/features/forms/components/generate-analysis-sheet";
import { getUserFormByIdQuery } from "@/features/forms/queries";
import { EditQuestionsType } from "@/features/forms/schema";
import { authenticatedQuery } from "@/lib/queries";
import { getFileUrl } from "@/lib/r2/functions";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function FormsDetailPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;

  const [result, t] = await Promise.all([
    authenticatedQuery(async ({ supabase, userId, userRole, userTier }) => {
      const form = await getUserFormByIdQuery({ formId, userId, supabase });
      return {
        form,
        isProEnabled: canUseProFeatures({ role: userRole, tier: userTier }),
      };
    }),
    getTranslations(),
  ]);

  const { form, isProEnabled } = result;

  if (!form) notFound();

  type QuestionRaw = EditQuestionsType["questions"][0] & {
    file_key?: string | null;
  };
  const questionsRaw = form.questions as unknown as QuestionRaw[];
  const initialFileUrls: Record<string, string | null> = Object.fromEntries(
    questionsRaw.map((question) => [
      question.id,
      question.file_key ? getFileUrl(question.file_key) : null,
    ]),
  );

  const backgroundImageUrl = form.background_image_key
    ? getFileUrl(form.background_image_key)
    : null;
  const backgroundMusicUrl = form.background_music_key
    ? getFileUrl(form.background_music_key)
    : null;

  return (
    <DashboardWrapper
      title={form.name}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {isProEnabled && (
            <>
              <ChangeFormVoiceSheet
                formId={form.id}
                initialVoiceId={form.voice_id}
                initialVoiceSpeed={form.voice_speed}
              />
              <GenerateAnalysisSheet
                formId={form.id}
                initialAnalysisInstructions={form.analysis_instructions}
              />
            </>
          )}
          <EditFormSheet
            formData={form}
            backgroundImageUrl={backgroundImageUrl}
            backgroundMusicUrl={backgroundMusicUrl}
            allowProFeatures={isProEnabled}
            showAssetControls={false}
          />
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {t("dashboard.forms.detail.name")}
          </p>
          <p className="text-sm text-muted-foreground">{form.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {t("dashboard.forms.detail.type")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(`forms.types.${form.type ?? "mixed"}`)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {t("dashboard.forms.detail.language")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(`forms.languages.${form.language ?? "it"}`)}
          </p>
        </div>
      </div>
      <Separator />
      <EditQuestionsForm
        questionsData={questionsRaw as unknown as EditQuestionsType["questions"]}
        formId={formId}
        language={form.language}
        initialFileUrls={initialFileUrls}
        allowVoiceControls={isProEnabled}
      />
    </DashboardWrapper>
  );
}
