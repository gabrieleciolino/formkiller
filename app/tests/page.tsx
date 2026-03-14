import { getPublishedTestsListQuery } from "@/features/tests/queries";
import { publicQuery } from "@/lib/queries";
import { urls } from "@/lib/urls";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

const BG_URL =
  "https://assets.formkiller.cloud/library/1773473263392-e46908fc-af4e-46d1-841d-b23e8ed576d0.jpg";

export default async function PublicTestsListPage() {
  const [tests, t] = await Promise.all([
    publicQuery(async ({ supabase }) =>
      getPublishedTestsListQuery({ supabase }),
    ),
    getTranslations(),
  ]);

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim {
          opacity: 0;
          animation: fadeSlideUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .card-hover:hover {
          transform: translateY(-2px) rotate(0.3deg);
        }
        .card-hover:active {
          transform: scale(0.97);
        }
        .card-hover {
          transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s ease;
        }
        .card-hover:hover {
          box-shadow: 0 12px 32px rgba(0,0,0,0.18);
        }
      `}</style>

      <main
        className="relative min-h-dvh bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BG_URL})` }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative mx-auto flex w-full max-w-md flex-col px-5 pb-16 pt-12">
          {/* Header */}
          <header
            className="anim text-center"
            style={{ animationDelay: "0ms" }}
          >
            <span className="inline-block rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/80 backdrop-blur-sm">
              {t("tests.public.eyebrow")}
            </span>
            <h1 className="font-roboto mt-4 text-[3rem] font-black leading-[1.0] tracking-tight text-white drop-shadow-lg">
              {t("tests.public.title")}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              {t("tests.public.description")}
            </p>
          </header>

          {/* List */}
          <section className="mt-10 space-y-3">
            {tests.length === 0 ? (
              <div
                className="anim rounded-3xl bg-white/90 p-6 text-center text-sm text-gray-500 backdrop-blur-md"
                style={{ animationDelay: "120ms" }}
              >
                {t("tests.public.empty")}
              </div>
            ) : (
              tests.map((test, index) => {
                const subtitle =
                  test.intro_title?.trim() ||
                  test.intro_message?.trim() ||
                  t("tests.public.noSubtitle");

                return (
                  <Link
                    key={test.id}
                    href={urls.test(test.slug)}
                    className="anim card-hover block"
                    style={{ animationDelay: `${120 + index * 70}ms` }}
                  >
                    <div className="overflow-hidden rounded-3xl bg-white/95 backdrop-blur-md">
                      {/* Top accent stripe */}
                      <div className="h-1 w-full" style={{ backgroundColor: "#2e657d" }} />

                      <div className="flex items-center gap-4 px-5 py-4">
                        <div className="min-w-0 flex-1">
                          <h2 className="font-roboto text-lg font-black leading-snug tracking-tight" style={{ color: "#2e657d" }}>
                            {test.name}
                          </h2>
                          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">
                            {subtitle}
                          </p>
                          <p className="mt-3 text-[11px] font-bold uppercase tracking-widest" style={{ color: "#2e657d" }}>
                            {t("tests.public.cta")} →
                          </p>
                        </div>

                        <div className="flex size-11 shrink-0 items-center justify-center rounded-full text-white shadow-md" style={{ backgroundColor: "#2e657d", boxShadow: "0 4px 12px #2e657d55" }}>
                          <ArrowRight className="size-5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </section>

          {/* Footer */}
          <footer
            className="anim mt-14 flex flex-col items-center gap-2 pb-2"
            style={{ animationDelay: `${120 + tests.length * 70}ms` }}
          >
            <p className="text-[10px] font-medium uppercase tracking-widest text-white/30">
              powered by
            </p>
            <Image
              src="/logo.png"
              alt={t("tests.public.logoAlt")}
              width={120}
              height={31}
              className="h-auto"
              priority
            />
          </footer>
        </div>
      </main>
    </>
  );
}
