import { getAdminTestsQuery } from "@/features/tests/queries";
import { adminQuery } from "@/lib/queries";
import { urls } from "@/lib/urls";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function AdminSlidesPage() {
  const [tests, t] = await Promise.all([
    adminQuery(async ({ supabase }) => getAdminTestsQuery({ supabase })),
    getTranslations(),
  ]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-medium text-foreground">
          {t("dashboard.slides.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.slides.description")}
        </p>
      </div>

      {tests.length === 0 ? (
        <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">
          {t("dashboard.slides.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tests.map((test) => (
            <Link
              key={test.id}
              href={urls.admin.slides.detail(test.id)}
              className="rounded-md border border-border p-4 transition-colors hover:bg-muted/40"
            >
              <div className="space-y-2">
                <h3 className="line-clamp-2 text-base font-semibold text-foreground">
                  {test.name}
                </h3>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  /{test.slug}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border px-2 py-0.5">
                    {t(
                      `forms.languages.${test.language}` as Parameters<typeof t>[0],
                    )}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5">
                    {t(`tests.status.${test.status}` as Parameters<typeof t>[0])}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {t("dashboard.slides.open")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
