import Image from "next/image";
import Link from "next/link";
import {
  Mic,
  BarChart3,
  ChevronRight,
  CheckCircle2,
  Layers,
  MousePointerClick,
  Play,
  Zap,
  ImageIcon,
  Globe,
} from "lucide-react";
import CookieBanner from "@/app/_components/cookie-banner";
import HeroFlowVideo from "@/app/_components/hero-flow-video";
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
  videoPreview: {
    muteLabel: string;
    unmuteLabel: string;
  };
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
  ctaSectionFormTitle: string;
  ctaSectionFormUnavailable: string;
  cookieBanner: {
    title: string;
    description: string;
    accept: string;
    reject: string;
  };
  footer: {
    copyright: string;
    signIn: string;
    cookiePolicyLabel: string;
    cookiePolicyHref: string;
    privacyPolicyLabel: string;
    privacyPolicyHref: string;
  };
}

const featureIcons = [Mic, MousePointerClick, Zap, BarChart3, ImageIcon, Globe];
const modeIcons = [Layers, Mic, MousePointerClick];

interface LandingPageProps {
  content: LandingContent;
  contactFormId: string;
}

export default function LandingPage({
  content,
  contactFormId,
}: LandingPageProps) {
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
            priority
            className="h-8 w-auto"
          />
          <nav className="flex items-center gap-3">
            <a
              href="#contact-form"
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80"
            >
              {content.nav.getStarted}
            </a>
          </nav>
        </div>
      </header>

      <main>
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
            <a
              href="#contact-form"
              className="group flex items-center gap-2 rounded-xl bg-primary-foreground px-8 py-3.5 text-base font-semibold text-primary transition-opacity hover:opacity-90"
            >
              {content.heroPrimary}
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 rounded-xl border border-primary-foreground/30 px-8 py-3.5 text-base font-medium text-primary-foreground/80 transition-colors hover:border-primary-foreground/60 hover:text-primary-foreground"
            >
              <Play className="size-4" />
              {content.heroSecondary}
            </a>
          </div>
        </div>

        {/* Product flow preview */}
        <HeroFlowVideo
          muteLabel={content.videoPreview.muteLabel}
          unmuteLabel={content.videoPreview.unmuteLabel}
        />
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
                <p className="font-roboto text-4xl font-black text-muted-foreground">
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
        <section
          id="contact-form"
          className="scroll-mt-24 bg-primary py-24 text-primary-foreground"
        >
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="font-roboto text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
            {content.ctaSectionH2Line1}
            <br />
            {content.ctaSectionH2Line2}
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-primary-foreground/70">
            {content.ctaSectionDescription}
          </p>
          <div className="mx-auto mt-10 max-w-md overflow-hidden rounded-2xl border border-primary-foreground/20 bg-primary-foreground/5 shadow-sm">
            {contactFormId ? (
              <iframe
                src={urls.form(contactFormId)}
                title={content.ctaSectionFormTitle}
                loading="lazy"
                allow="microphone"
                className="h-[600px] md:h-[680px] w-full"
              />
            ) : (
              <div className="flex min-h-[320px] items-center justify-center px-6 py-10 text-center text-sm text-primary-foreground/70">
                {content.ctaSectionFormUnavailable}
              </div>
            )}
          </div>
        </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-4 px-6 py-8 text-sm text-muted-foreground md:grid-cols-[1fr_auto_1fr]">
          <div className="flex justify-center md:justify-start">
            <Image
              src="/logo.png"
              alt="FormKiller"
              width={120}
              height={31}
              className="h-7 w-auto"
            />
          </div>
          <nav className="flex items-center justify-center gap-4">
            <Link
              href={content.footer.cookiePolicyHref}
              className="transition-colors hover:text-foreground"
            >
              {content.footer.cookiePolicyLabel}
            </Link>
            <span aria-hidden="true" className="text-border">
              /
            </span>
            <Link
              href={content.footer.privacyPolicyHref}
              className="transition-colors hover:text-foreground"
            >
              {content.footer.privacyPolicyLabel}
            </Link>
          </nav>
          <p className="text-center md:text-right">{content.footer.copyright}</p>
        </div>
      </footer>

      <CookieBanner
        title={content.cookieBanner.title}
        description={content.cookieBanner.description}
        acceptLabel={content.cookieBanner.accept}
        rejectLabel={content.cookieBanner.reject}
        privacyPolicyLabel={content.footer.privacyPolicyLabel}
        privacyPolicyHref={content.footer.privacyPolicyHref}
        cookiePolicyLabel={content.footer.cookiePolicyLabel}
        cookiePolicyHref={content.footer.cookiePolicyHref}
      />
    </div>
  );
}
