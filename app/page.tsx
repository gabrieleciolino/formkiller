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

const features = [
  {
    icon: Mic,
    title: "Voice-first answering",
    description:
      "Respondents answer questions using their voice. Automatic speech-to-text transcription, no typing required.",
  },
  {
    icon: MousePointerClick,
    title: "Button fallbacks",
    description:
      "Pre-defined answer buttons alongside voice input. Choose mixed, voice-only, or button-only mode per form.",
  },
  {
    icon: Zap,
    title: "AI-generated TTS",
    description:
      "Questions are read aloud using AI text-to-speech so respondents never need to read anything.",
  },
  {
    icon: BarChart3,
    title: "Lead capture built-in",
    description:
      "Every submission collects name, email and phone automatically at the end of the conversation.",
  },
  {
    icon: ImageIcon,
    title: "Rich media backgrounds",
    description:
      "Set custom background images and looping background music to create an immersive branded experience.",
  },
  {
    icon: Globe,
    title: "Multilingual",
    description:
      "Forms available in English, Italian and Spanish. TTS and UI adapt automatically to the selected language.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your form",
    description:
      "Name your form, pick a language and add your questions. Choose how respondents can answer: voice, buttons, or both.",
  },
  {
    number: "02",
    title: "Customise the experience",
    description:
      "Set a background image, ambient music and a light or dark theme. Generate AI voice-overs for each question.",
  },
  {
    number: "03",
    title: "Share the link",
    description:
      "Send the unique form URL to respondents. They complete it in any browser — no app, no login required.",
  },
  {
    number: "04",
    title: "Collect leads",
    description:
      "View every session and lead in the dashboard. Export responses and contact details when you need them.",
  },
];

const stats = [
  { value: "3×", label: "higher completion rate vs text forms" },
  { value: "< 60s", label: "to create and publish a form" },
  { value: "3", label: "languages supported" },
  { value: "0", label: "apps needed to respond" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Image src="/logo.png" alt="FormKiller" width={140} height={36} className="h-8 w-auto" />
          <nav className="flex items-center gap-3">
            <Link
              href={urls.auth.login}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href={urls.auth.login}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80"
            >
              Get started
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
            <span>Voice-powered conversational forms</span>
          </div>

          <h1 className="font-roboto text-5xl font-black leading-none tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            Forms that
            <br />
            <span className="opacity-50">actually</span> get
            <br />
            answered.
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-primary-foreground/70">
            FormKiller turns static questionnaires into immersive voice-driven
            conversations. Higher completion rates, richer answers, zero
            friction.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={urls.auth.login}
              className="group flex items-center gap-2 rounded-xl bg-primary-foreground px-8 py-3.5 text-base font-semibold text-primary transition-opacity hover:opacity-90"
            >
              Create your first form
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 rounded-xl border border-primary-foreground/30 px-8 py-3.5 text-base font-medium text-primary-foreground/80 transition-colors hover:border-primary-foreground/60 hover:text-primary-foreground"
            >
              <Play className="size-4" />
              See how it works
            </a>
          </div>
        </div>

        {/* Mock form card */}
        <div className="relative mx-auto mt-20 w-full max-w-sm">
          <div className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-6 backdrop-blur-sm">
            <p className="mb-2 text-xs uppercase tracking-widest text-primary-foreground/40">
              Step 2 / 5
            </p>
            <p className="text-xl font-semibold leading-snug text-primary-foreground">
              What is the main goal you want to achieve this quarter?
            </p>
            <div className="mt-6 flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-primary-foreground/30 bg-primary-foreground/10">
                <Mic className="size-7 text-primary-foreground/70" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {["Grow revenue", "Reduce churn", "Launch product", "Hire team"].map(
                (label) => (
                  <button
                    key={label}
                    className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/5 px-3 py-2 text-sm text-primary-foreground/70"
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-muted/30 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {stats.map((s) => (
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
              Features
            </p>
            <h2 className="font-roboto text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              Everything you need.
              <br />
              Nothing you don&apos;t.
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary">
                  <f.icon className="size-5 text-primary-foreground" />
                </div>
                <h3 className="font-roboto text-lg font-black">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 max-w-xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              How it works
            </p>
            <h2 className="font-roboto text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              From zero to live
              <br />
              in minutes.
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.number} className="relative">
                {i < steps.length - 1 && (
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
                Flexible answer modes
              </p>
              <h2 className="font-roboto text-4xl font-black leading-tight tracking-tight">
                Your form,
                <br />
                your rules.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Every form can be configured for the channel and audience that
                suits you best. Mix voice with preset buttons, go fully
                conversational, or keep it classic.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Voice + buttons — best of both worlds",
                  "Voice only — fully conversational",
                  "Buttons only — guided selection",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    label: "Mixed",
                    sublabel: "Voice + Buttons",
                    icon: Layers,
                    desc: "Respondents can speak or tap. Maximum flexibility for any audience.",
                  },
                  {
                    label: "Voice only",
                    sublabel: "Conversational",
                    icon: Mic,
                    desc: "Pure voice interaction. Perfect for qualitative research and feedback.",
                  },
                  {
                    label: "Buttons only",
                    sublabel: "Guided",
                    icon: MousePointerClick,
                    desc: "Pre-defined choices only. Great for quick surveys and structured data.",
                  },
                ].map((mode) => (
                  <div
                    key={mode.label}
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-muted">
                      <mode.icon className="size-4 text-muted-foreground" />
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
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-24 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-roboto text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Ready to kill
            <br />
            boring forms?
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-lg text-primary-foreground/70">
            Create your first voice form in under a minute. No credit card
            required.
          </p>
          <Link
            href={urls.auth.login}
            className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-primary-foreground px-10 py-4 text-base font-semibold text-primary transition-opacity hover:opacity-90"
          >
            Start for free
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <Image src="/logo.png" alt="FormKiller" width={120} height={31} className="h-7 w-auto" />
          <p>© {new Date().getFullYear()} FormKiller. All rights reserved.</p>
          <Link
            href={urls.auth.login}
            className="transition-colors hover:text-foreground"
          >
            Sign in →
          </Link>
        </div>
      </footer>
    </div>
  );
}
