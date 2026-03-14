import { getPublishedTestsListQuery } from "@/features/tests/queries";
import { publicQuery } from "@/lib/queries";
import { urls } from "@/lib/urls";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

export default async function PublicTestsListPage() {
  const [tests, t] = await Promise.all([
    publicQuery(async ({ supabase }) => getPublishedTestsListQuery({ supabase })),
    getTranslations(),
  ]);

  return (
    <main className="min-h-dvh bg-gradient-to-b from-background via-muted/40 to-background">
      <div className="mx-auto flex w-full max-w-md flex-col px-4 pb-16 pt-8">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {t("tests.public.eyebrow")}
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("tests.public.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("tests.public.description")}
          </p>
        </header>

        <section className="mt-6 space-y-3">
          {tests.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
              {t("tests.public.empty")}
            </div>
          ) : (
            tests.map((test) => {
              const subtitle =
                test.intro_title?.trim() ||
                test.intro_message?.trim() ||
                t("tests.public.noSubtitle");

              return (
                <Link
                  key={test.id}
                  href={urls.test(test.slug)}
                  className="group block rounded-2xl border border-border bg-card p-4 shadow-sm transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {t(`forms.languages.${test.language}` as Parameters<typeof t>[0])}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-1" />
                  </div>

                  <h2 className="mt-3 text-base font-semibold leading-snug text-foreground">
                    {test.name}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {subtitle}
                  </p>

                  <p className="mt-4 text-sm font-medium text-foreground">
                    {t("tests.public.cta")}
                  </p>
                </Link>
              );
            })
          )}
        </section>

        <footer className="mt-10 flex justify-center pb-2 pt-4">
          <Image
            src="/logo.png"
            alt={t("tests.public.logoAlt")}
            width={156}
            height={48}
            className="h-auto w-[132px] opacity-80"
            priority
          />
        </footer>
      </div>
    </main>
  );
}
