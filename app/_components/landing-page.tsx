import Image from "next/image";
import Link from "next/link";
import {
  Mic,
  MousePointerClick,
  Zap,
  BarChart3,
  ImageIcon,
  Globe,
  ChevronRight,
  Play,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { urls } from "@/lib/urls";

export interface LandingContent {
  nav: {
    signIn: string;
    getStarted: string;
  };
  hero: {
    badge: string;
    h1Before: string;
    h1Highlight: string;
    /** Optional text that appears after the highlight span and before the line break (e.g. "get" in English) */
    h1Mid?: string;
    h1After: string;
    description: string;
  };
  heroPrimary: string;
  heroSecondary: string;
  mockForm: {
    stepLabel: string;
    question: string;
    buttons: [string, string, string, string];
  };
  stats: { value: string; label: string }[];
  featuresLabel: string;
  featuresH2Line1: string;
  featuresH2Line2: string;
  features: { title: string; description: string }[];
  howItWorksLabel: string;
  howItWorksH2Line1: string;
  howItWorksH2Line2: string;
  steps: { number: string; title: string; description: string }[];
  modesLabel: string;
  modesH2Line1: string;
  modesH2Line2: string;
  modesDescription: string;
  modesCheckItems: [string, string, string];
  modeCards: [
    { label: string; sublabel: string; desc: string },
    { label: string; sublabel: string; desc: string },
    { label: string; sublabel: string; desc: string },
  ];
  ctaSectionH2Line1: string;
  ctaSectionH2Line2: string;
  ctaSectionDescription: string;
  ctaSectionButton: string;
  footer: {
    copyright: string;
    signIn: string;
  };
}

const featureIcons = [Mic, MousePointerClick, Zap, BarChart3, ImageIcon, Globe];
const modeIcons = [Layers, Mic, MousePointerClick];

interface LandingPageProps {
  content: LandingContent;
}

export default function LandingPage({ content }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Image
            src="/logo.png"
            alt="FormKiller"
            width={140}
            height={36}
            className="h-8 w-auto"
          />
          <nav className="flex items-center gap-3">
            <Link
              href={urls.auth.login}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80"
            >
              {content.nav.getStarted}
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-primary px-6 pb-24 pt-32 text-primary-foreground">
        {/* grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm">
            <Mic className="size-3.5" />
            <span>{content.hero.badge}</span>
          </div>

          <h1 className="font-roboto text-5xl font-black leading-none tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            {content.hero.h1Before}
            <br />
            <span className="opacity-50">{content.hero.h1Highlight}</span>
            {content.hero.h1Mid ? ` ${content.hero.h1Mid}` : ""}
            <br />
            {content.hero.h1After}
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-primary-foreground/70">
            {content.hero.description}
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={urls.auth.login}
              className="group flex items-center gap-2 rounded-xl bg-primary-foreground px-8 py-3.5 text-base font-semibold text-primary transition-opacity hover:opacity-90"
            >
              {content.heroPrimary}
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 rounded-xl border border-primary-foreground/30 px-8 py-3.5 text-base font-medium text-primary-foreground/80 transition-colors hover:border-primary-foreground/60 hover:text-primary-foreground"
            >
              <Play className="size-4" />
              {content.heroSecondary}
            </a>
          </div>
        </div>

        {/* Mock form card */}
        <div className="relative mx-auto mt-20 w-full max-w-sm">
          <div className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-6 backdrop-blur-sm">
            <p className="mb-2 text-xs uppercase tracking-widest text-primary-foreground/40">
              {content.mockForm.stepLabel}
            </p>
            <p className="text-xl font-semibold leading-snug text-primary-foreground">
              {content.mockForm.question}
            </p>
            <div className="mt-6 flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-primary-foreground/30 bg-primary-foreground/10">
                <Mic className="size-7 text-primary-foreground/70" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {content.mockForm.buttons.map((label) => (
                <button
                  key={label}
                  className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/5 px-3 py-2 text-sm text-primary-foreground/70"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-muted/30 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {content.stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-roboto text-3xl font-black text-foreground sm:text-4xl">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 max-w-xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              {content.featuresLabel}
            </p>
            <h2 className="font-roboto text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              {content.featuresH2Line1}
              <br />
              {content.featuresH2Line2}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {content.features.map((f, i) => {
              const Icon = featureIcons[i];
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary">
                    <Icon className="size-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-roboto text-lg font-black">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 max-w-xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              {content.howItWorksLabel}
            </p>
            <h2 className="font-roboto text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              {content.howItWorksH2Line1}
              <br />
              {content.howItWorksH2Line2}
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {content.steps.map((step, i) => (
              <div key={step.number} className="relative">
                {i < content.steps.length - 1 && (
                  <div className="absolute left-full top-5 hidden h-px w-full -translate-y-0.5 border-t border-dashed border-border lg:block" />
                )}
                <p className="font-roboto text-4xl font-black text-border">
                  {step.number}
                </p>
                <h3 className="mt-3 font-roboto text-lg font-black">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form modes comparison */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
            <div className="max-w-md shrink-0">
              <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                {content.modesLabel}
              </p>
              <h2 className="font-roboto text-4xl font-black leading-tight tracking-tight">
                {content.modesH2Line1}
                <br />
                {content.modesH2Line2}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {content.modesDescription}
              </p>
              <ul className="mt-6 space-y-3">
                {content.modesCheckItems.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1">
              <div className="grid gap-4 sm:grid-cols-3">
                {content.modeCards.map((mode, i) => {
                  const Icon = modeIcons[i];
                  return (
                    <div
                      key={mode.label}
                      className="rounded-2xl border border-border bg-card p-5"
                    >
                      <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-muted">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <p className="font-roboto text-base font-black">
                        {mode.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mode.sublabel}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {mode.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-24 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-roboto text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
            {content.ctaSectionH2Line1}
            <br />
            {content.ctaSectionH2Line2}
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-lg text-primary-foreground/70">
            {content.ctaSectionDescription}
          </p>
          <Link
            href={urls.auth.login}
            className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-primary-foreground px-10 py-4 text-base font-semibold text-primary transition-opacity hover:opacity-90"
          >
            {content.ctaSectionButton}
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <Image
            src="/logo.png"
            alt="FormKiller"
            width={120}
            height={31}
            className="h-7 w-auto"
          />
          <p>{content.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
