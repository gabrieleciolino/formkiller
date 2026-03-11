import LandingPage, { LandingContent } from "@/app/_components/landing-page";

const content: LandingContent = {
  nav: {
    signIn: "Sign in",
    getStarted: "Get started",
  },
  hero: {
    badge: "Voice-powered conversational forms",
    h1Before: "Forms that",
    h1Highlight: "actually",
    h1Mid: "get",
    h1After: "answered.",
    description:
      "FormKiller turns static questionnaires into immersive voice-driven conversations. Higher completion rates, richer answers, zero friction.",
  },
  heroPrimary: "Create your first form",
  heroSecondary: "See how it works",
  mockForm: {
    stepLabel: "Step 2 / 5",
    question: "What is the main goal you want to achieve this quarter?",
    buttons: ["Grow revenue", "Reduce churn", "Launch product", "Hire team"],
  },
  stats: [
    { value: "3×", label: "higher completion rate vs text forms" },
    { value: "< 60s", label: "to create and publish a form" },
    { value: "3", label: "languages supported" },
    { value: "0", label: "apps needed to respond" },
  ],
  featuresLabel: "Features",
  featuresH2Line1: "Everything you need.",
  featuresH2Line2: "Nothing you don't.",
  features: [
    {
      title: "Voice-first answering",
      description:
        "Respondents answer questions using their voice. Automatic speech-to-text transcription, no typing required.",
    },
    {
      title: "Button fallbacks",
      description:
        "Pre-defined answer buttons alongside voice input. Choose mixed, voice-only, or button-only mode per form.",
    },
    {
      title: "AI-generated TTS",
      description:
        "Questions are read aloud using AI text-to-speech so respondents never need to read anything.",
    },
    {
      title: "Lead capture built-in",
      description:
        "Every submission collects name, email and phone automatically at the end of the conversation.",
    },
    {
      title: "Rich media backgrounds",
      description:
        "Set custom background images and looping background music to create an immersive branded experience.",
    },
    {
      title: "Multilingual",
      description:
        "Forms available in English, Italian and Spanish. TTS and UI adapt automatically to the selected language.",
    },
  ],
  howItWorksLabel: "How it works",
  howItWorksH2Line1: "From zero to live",
  howItWorksH2Line2: "in minutes.",
  steps: [
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
  ],
  modesLabel: "Flexible answer modes",
  modesH2Line1: "Your form,",
  modesH2Line2: "your rules.",
  modesDescription:
    "Every form can be configured for the channel and audience that suits you best. Mix voice with preset buttons, go fully conversational, or keep it classic.",
  modesCheckItems: [
    "Voice + buttons — best of both worlds",
    "Voice only — fully conversational",
    "Buttons only — guided selection",
  ],
  modeCards: [
    {
      label: "Mixed",
      sublabel: "Voice + Buttons",
      desc: "Respondents can speak or tap. Maximum flexibility for any audience.",
    },
    {
      label: "Voice only",
      sublabel: "Conversational",
      desc: "Pure voice interaction. Perfect for qualitative research and feedback.",
    },
    {
      label: "Buttons only",
      sublabel: "Guided",
      desc: "Pre-defined choices only. Great for quick surveys and structured data.",
    },
  ],
  ctaSectionH2Line1: "Ready to kill",
  ctaSectionH2Line2: "boring forms?",
  ctaSectionDescription:
    "Create your first voice form in under a minute. No credit card required.",
  ctaSectionButton: "Start for free",
  footer: {
    copyright: `© ${new Date().getFullYear()} FormKiller. All rights reserved.`,
    signIn: "Sign in →",
  },
};

export default function HomePage() {
  return <LandingPage content={content} />;
}
