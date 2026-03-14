"use client";

import { urls } from "@/lib/urls";
import { ArrowRight, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const BG_URL =
  "https://assets.formkiller.cloud/library/1773489476490-610c016c-565a-4c45-8453-64bf8f901159.jpg";

type PublicTestCard = {
  id: string;
  slug: string;
  language: "en" | "it" | "es";
  name: string;
  intro_title: string | null;
  intro_message: string | null;
};

type PublicTestsListProps = {
  tests: PublicTestCard[];
};

const normalizeText = (value: string) =>
  value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export default function PublicTestsList({ tests }: PublicTestsListProps) {
  const t = useTranslations();
  const [query, setQuery] = useState("");

  const normalizedQuery = normalizeText(query);

  const filteredTests = useMemo(() => {
    if (!normalizedQuery) {
      return tests;
    }

    return tests.filter((test) =>
      normalizeText(test.name).includes(normalizedQuery),
    );
  }, [normalizedQuery, tests]);

  const emptyMessage = normalizedQuery
    ? t("tests.public.noResults", { query })
    : t("tests.public.empty");

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
        <div className="relative mx-auto flex w-full max-w-md flex-col p-5">
          <header
            className="anim text-center"
            style={{ animationDelay: "0ms" }}
          >
            <div className="flex justify-center">
              <Image
                src="/logo-seituilproblema.png"
                alt={t("tests.public.logoAlt")}
                width={240}
                height={58}
                className="h-auto w-[190px] sm:w-[220px]"
                priority
              />
            </div>
            <h1 className="font-roboto text-[3rem] font-black leading-[1.0] tracking-tight text-white drop-shadow-lg">
              {t("tests.public.title")}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              {t("tests.public.description")}
            </p>
          </header>

          <div
            className="anim mt-4 rounded-2xl border border-white/25 bg-white/90 px-3 py-2 backdrop-blur-md"
            style={{ animationDelay: "80ms" }}
          >
            <label className="flex items-center gap-2">
              <Search className="size-4 text-[#2e657d]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("tests.public.searchPlaceholder")}
                aria-label={t("tests.public.searchPlaceholder")}
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
                type="search"
              />
            </label>
          </div>

          <section className="mt-6 space-y-3">
            {filteredTests.length === 0 ? (
              <div
                className="anim rounded-3xl bg-white/90 p-6 text-center text-sm text-gray-500 backdrop-blur-md"
                style={{ animationDelay: "120ms" }}
              >
                {emptyMessage}
              </div>
            ) : (
              filteredTests.map((test, index) => {
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
                      <div
                        className="h-1 w-full"
                        style={{ backgroundColor: "#2e657d" }}
                      />

                      <div className="flex items-center gap-4 px-5 py-4">
                        <div className="min-w-0 flex-1">
                          <h2
                            className="font-roboto text-lg font-black leading-snug tracking-tight"
                            style={{ color: "#2e657d" }}
                          >
                            {test.name}
                          </h2>
                          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">
                            {subtitle}
                          </p>
                          <p
                            className="mt-3 text-[11px] font-bold uppercase tracking-widest"
                            style={{ color: "#2e657d" }}
                          >
                            {t("tests.public.cta")} →
                          </p>
                        </div>

                        <div
                          className="flex size-11 shrink-0 items-center justify-center rounded-full text-white shadow-md"
                          style={{
                            backgroundColor: "#2e657d",
                            boxShadow: "0 4px 12px #2e657d55",
                          }}
                        >
                          <ArrowRight className="size-5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </section>

          <footer
            className="anim mt-14 flex flex-col items-center gap-1 pb-2"
            style={{ animationDelay: `${120 + filteredTests.length * 70}ms` }}
          >
            <p className="text-[10px] font-medium uppercase tracking-widest text-black/30">
              powered by
            </p>
            <Link href={urls.home}>
              <Image
                src="/logo.png"
                alt="FormKiller"
                width={120}
                height={31}
                priority
              />
            </Link>
          </footer>
        </div>
      </main>
    </>
  );
}
