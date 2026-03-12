import AudioPlayer from "@/app/dashboard/leads/[leadId]/audio-player";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getAdminLeadDetailQuery } from "@/features/leads/queries";
import { adminQuery } from "@/lib/queries";
import { getFileUrl } from "@/lib/r2/functions";
import { urls } from "@/lib/urls";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const [result, t] = await Promise.all([
    adminQuery(({ supabase }) => getAdminLeadDetailQuery({ supabase, leadId })),
    getTranslations(),
  ]);

  if (!result) notFound();

  const { lead, answers } = result;
  const form = lead.form as { name: string } | null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-foreground">{lead.name}</h2>
        <Button asChild variant="outline" size="sm">
          <Link href={urls.admin.leads.index}>{t("dashboard.leads.detail.back")}</Link>
        </Button>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t("dashboard.leads.detail.contact")}
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t("dashboard.leads.columns.name")}
            </p>
            <p className="text-sm">{lead.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t("dashboard.leads.columns.email")}
            </p>
            <p className="text-sm">{lead.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t("dashboard.leads.columns.phone")}
            </p>
            <p className="text-sm">{lead.phone}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t("dashboard.leads.columns.form")}
            </p>
            <p className="text-sm">{form?.name ?? "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t("dashboard.users.columns.userId")}
            </p>
            <p className="font-mono text-xs">{lead.user_id}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t("dashboard.leads.detail.submittedAt")}
            </p>
            <p className="text-sm">
              {lead.created_at
                ? new Date(lead.created_at).toLocaleString()
                : "—"}
            </p>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t("dashboard.leads.detail.answers")}
        </h3>

        {answers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.leads.detail.noAnswers")}
          </p>
        ) : (
          <div className="space-y-3">
            {answers.map((answer) => {
              const question = answer.question as
                | { question: string; order: number }
                | null;
              const audioUrl = answer.file_key
                ? getFileUrl(answer.file_key)
                : null;

              return (
                <div
                  key={answer.id}
                  className="rounded-lg border border-border p-4 space-y-2"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {question?.question ?? "—"}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {answer.default_answer && (
                      <span className="rounded-full bg-secondary px-3 py-1 text-sm">
                        {answer.default_answer}
                      </span>
                    )}
                    {answer.stt && !answer.default_answer && (
                      <span className="text-sm">
                        <span className="text-xs text-muted-foreground mr-1">
                          {t("dashboard.leads.detail.transcript")}:
                        </span>
                        {answer.stt}
                      </span>
                    )}
                    {!answer.default_answer && !answer.stt && audioUrl && (
                      <span className="text-sm text-muted-foreground italic">
                        {t("dashboard.leads.detail.voiceAnswer")}
                      </span>
                    )}
                    {audioUrl && <AudioPlayer url={audioUrl} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
