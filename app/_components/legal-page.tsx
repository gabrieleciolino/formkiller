import Image from "next/image";
import Link from "next/link";
import type { LegalCopy } from "@/app/_components/legal-content";

interface LegalPageProps {
  copy: LegalCopy;
  homeHref: string;
}

export default function LegalPage({ copy, homeHref }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
          <Link href={homeHref} className="inline-flex items-center">
            <Image
              src="/logo.png"
              alt="FormKiller"
              width={140}
              height={36}
              priority
              className="h-8 w-auto"
            />
          </Link>
          <Link
            href={homeHref}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {copy.backToHomeLabel}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <article className="space-y-10">
          <div className="space-y-3">
            <h1 className="font-roboto text-4xl font-black tracking-tight sm:text-5xl">
              {copy.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {copy.lastUpdatedLabel}: {copy.lastUpdatedValue}
            </p>
            <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
              {copy.intro}
            </p>
          </div>

          {copy.sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="font-roboto text-2xl font-black">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm leading-relaxed text-muted-foreground sm:text-base"
                >
                  {paragraph}
                </p>
              ))}
              {section.items ? (
                <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </article>
      </main>
    </div>
  );
}
