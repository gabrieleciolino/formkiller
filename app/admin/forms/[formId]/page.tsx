import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ChangeFormVoiceSheet from "@/features/forms/components/change-form-voice-sheet";
import EditFormSheet from "@/features/forms/components/edit-form-sheet";
import EditQuestionsForm from "@/features/forms/components/edit-questions-form";
import GenerateAnalysisSheet from "@/features/forms/components/generate-analysis-sheet";
import PublishFormButton from "@/features/forms/components/publish-form-button";
import { getFormByIdQuery } from "@/features/forms/queries";
import { EditQuestionsType } from "@/features/forms/schema";
import { adminQuery } from "@/lib/queries";
import { getFileUrl } from "@/lib/r2/functions";
import { urls } from "@/lib/urls";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminFormDetailPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;

  const [form, t] = await Promise.all([
    adminQuery(async ({ supabase }) => getFormByIdQuery({ formId, supabase })),
    getTranslations(),
  ]);

  if (!form) notFound();

  type QuestionRaw = EditQuestionsType["questions"][0] & {
    file_key?: string | null;
  };
  const questionsRaw = form.questions as unknown as QuestionRaw[];
  const hasGeneratedTts = questionsRaw.some((q) => Boolean(q.file_key));
  const initialFileUrls: Record<string, string | null> = Object.fromEntries(
    questionsRaw.map((q) => [q.id, q.file_key ? getFileUrl(q.file_key) : null]),
  );

  const backgroundImageUrl = form.background_image_key
    ? getFileUrl(form.background_image_key)
    : null;
  const backgroundMusicUrl = form.background_music_key
    ? getFileUrl(form.background_music_key)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-foreground">{form.name}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {form.is_published ? (
            form.slug && form.owner_username ? (
              <Button asChild variant="outline">
                <Link
                  href={urls.form(form.owner_username, form.slug)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("dashboard.forms.columns.open")}
                </Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                {t("dashboard.forms.columns.open")}
              </Button>
            )
          ) : (
            <PublishFormButton
              formId={form.id}
              name={form.name}
              type={form.type}
              theme={form.theme}
              backgroundImageKey={form.background_image_key}
              backgroundMusicKey={form.background_music_key}
              introTitle={form.intro_title}
              introMessage={form.intro_message}
              endTitle={form.end_title}
              endMessage={form.end_message}
            />
          )}
          <ChangeFormVoiceSheet
            formId={form.id}
            initialVoiceId={form.voice_id}
            initialVoiceSpeed={form.voice_speed}
            hasGeneratedTts={hasGeneratedTts}
          />
          <GenerateAnalysisSheet
            formId={form.id}
            initialAnalysisInstructions={form.analysis_instructions}
          />
          <EditFormSheet
            formData={form}
            backgroundImageUrl={backgroundImageUrl}
            backgroundMusicUrl={backgroundMusicUrl}
            allowProFeatures
            showAssetControls
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{t("dashboard.forms.detail.name")}</p>
          <p className="text-sm text-muted-foreground">{form.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">{t("dashboard.forms.detail.type")}</p>
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
        <div className="space-y-1">
          <p className="text-sm font-medium">{t("dashboard.forms.columns.owner")}</p>
          <p className="text-sm text-muted-foreground">
            {form.owner_username ?? form.user_id}
          </p>
        </div>
        <div className="col-span-2 space-y-1 md:col-span-4">
          <p className="text-sm font-medium">
            {t("dashboard.forms.detail.instructions")}
          </p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {form.instructions}
          </p>
        </div>
      </div>

      <Separator />

      <EditQuestionsForm
        questionsData={questionsRaw as unknown as EditQuestionsType["questions"]}
        formId={formId}
        language={form.language}
        voiceId={form.voice_id}
        voiceSpeed={form.voice_speed}
        initialFileUrls={initialFileUrls}
      />
    </div>
  );
}
