import LandingPage, { LandingContent } from "@/app/_components/landing-page";
import { getHomeMetadata } from "@/lib/seo/home-metadata";

export const metadata = getHomeMetadata("it");
const contactFormId = (process.env.CONTACT_FORM_ID ?? "").trim();

const content: LandingContent = {
  nav: {
    signIn: "Accedi",
    getStarted: "Parla con noi",
  },
  hero: {
    badge: "Form conversazionali basati sulla voce",
    h1Before: "Form che",
    h1Highlight: "davvero",
    h1After: "vengono compilati.",
    description:
      "FormKiller trasforma i questionari statici in conversazioni vocali che il tuo pubblico completa davvero. Più completamenti, risposte più ricche, meno abbandoni.",
  },
  heroPrimary: "Richiedi una demo su misura",
  heroSecondary: "Scopri come funziona",
  mockForm: {
    stepLabel: "Fase 2 / 5",
    question:
      "Qual è l'obiettivo principale che vuoi raggiungere questo trimestre?",
    buttons: [
      "Aumentare i ricavi",
      "Ridurre il churn",
      "Lanciare il prodotto",
      "Assumere il team",
    ],
  },
  stats: [
    {
      value: "3×",
      label: "tasso di completamento più alto rispetto ai form testuali",
    },
    { value: "< 60s", label: "per creare e pubblicare un form" },
    { value: "3", label: "lingue supportate" },
    { value: "0", label: "app necessarie per rispondere" },
  ],
  featuresLabel: "Funzionalità",
  featuresH2Line1: "Tutto ciò che serve.",
  featuresH2Line2: "Niente di superfluo.",
  features: [
    {
      title: "Risposta vocale",
      description:
        "I partecipanti rispondono alle domande con la voce. Trascrizione automatica parlato-testo, nessuna digitazione richiesta.",
    },
    {
      title: "Pulsanti di riserva",
      description:
        "Pulsanti di risposta predefiniti accanto all'input vocale. Scegli modalità mista, solo voce o solo pulsanti per ogni form.",
    },
    {
      title: "TTS generato dall'IA",
      description:
        "Le domande vengono lette ad alta voce tramite sintesi vocale IA, così i partecipanti non devono leggere nulla.",
    },
    {
      title: "Raccolta lead integrata",
      description:
        "Ogni invio raccoglie automaticamente nome, email e telefono al termine della conversazione.",
    },
    {
      title: "Sfondi multimediali",
      description:
        "Imposta immagini di sfondo personalizzate e musica di sottofondo in loop per un'esperienza immersiva e brandizzata.",
    },
    {
      title: "Multilingue",
      description:
        "Form disponibili in inglese, italiano e spagnolo. TTS e interfaccia si adattano automaticamente alla lingua selezionata.",
    },
  ],
  howItWorksLabel: "Come funziona",
  howItWorksH2Line1: "Da zero a live",
  howItWorksH2Line2: "in pochi minuti.",
  steps: [
    {
      number: "01",
      title: "Crea il tuo form",
      description:
        "Dai un nome al form, scegli la lingua e aggiungi le tue domande. Decidi come i partecipanti possono rispondere: voce, pulsanti o entrambi.",
    },
    {
      number: "02",
      title: "Personalizza l'esperienza",
      description:
        "Imposta un'immagine di sfondo, musica ambientale e un tema chiaro o scuro. Genera voci AI per ogni domanda.",
    },
    {
      number: "03",
      title: "Condividi il link",
      description:
        "Invia l'URL unico del form ai partecipanti. Lo completano in qualsiasi browser — nessuna app, nessun accesso richiesto.",
    },
    {
      number: "04",
      title: "Raccogli i lead",
      description:
        "Monitora sessioni e lead in dashboard, con dati di contatto, trascrizioni e risposte vocali.",
    },
  ],
  modesLabel: "Modalità di risposta flessibili",
  modesH2Line1: "Il tuo form,",
  modesH2Line2: "le tue regole.",
  modesDescription:
    "Ogni form può essere configurato per il canale e il pubblico più adatti a te. Mescola voce e pulsanti predefiniti, scegli il conversazionale puro o mantieni il classico.",
  modesCheckItems: [
    "Voce + pulsanti — il meglio di entrambi",
    "Solo voce — completamente conversazionale",
    "Solo pulsanti — selezione guidata",
  ],
  modeCards: [
    {
      label: "Misto",
      sublabel: "Voce + Pulsanti",
      desc: "I partecipanti possono parlare o toccare. Massima flessibilità per qualsiasi pubblico.",
    },
    {
      label: "Solo voce",
      sublabel: "Conversazionale",
      desc: "Interazione puramente vocale. Perfetta per ricerche qualitative e raccolta di feedback.",
    },
    {
      label: "Solo pulsanti",
      sublabel: "Guidato",
      desc: "Solo scelte predefinite. Ideale per sondaggi rapidi e dati strutturati.",
    },
  ],
  ctaSectionH2Line1: "Vuoi un form vocale",
  ctaSectionH2Line2: "per il tuo funnel?",
  ctaSectionDescription:
    "Raccontaci il tuo obiettivo e ti aiutiamo a disegnare il flusso conversazionale giusto.",
  ctaSectionFormTitle: "Form di contatto FormKiller",
  ctaSectionFormUnavailable:
    "Imposta CONTACT_FORM_ID per mostrare il form di contatto incorporato.",
  cookieBanner: {
    title: "Questo sito utilizza cookie",
    description:
      "Usiamo cookie tecnici per mantenere il sito sicuro e funzionante e, con il tuo consenso, cookie analitici per migliorare l'esperienza.",
    accept: "Accetta",
    reject: "Rifiuta",
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} FormKiller. Tutti i diritti riservati.`,
    signIn: "Accedi →",
    cookiePolicyLabel: "Cookie Policy",
    cookiePolicyHref: "/it/cookie-policy",
    privacyPolicyLabel: "Privacy Policy",
    privacyPolicyHref: "/it/privacy-policy",
  },
};

export default function HomePageIT() {
  return <LandingPage content={content} contactFormId={contactFormId} />;
}
