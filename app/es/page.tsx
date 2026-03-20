import LandingPage, { LandingContent } from "@/app/_components/landing-page";
import { getHomeMetadata } from "@/lib/seo/home-metadata";

export const metadata = getHomeMetadata("es");
const contactFormUsername = (process.env.CONTACT_FORM_USERNAME ?? "").trim();
const contactFormSlug = (process.env.CONTACT_FORM_SLUG ?? "").trim();

const content: LandingContent = {
  nav: {
    signIn: "Iniciar sesión",
    getStarted: "Habla con nosotros",
  },
  hero: {
    badge: "Formularios conversacionales por voz",
    h1Before: "Formularios que",
    h1Highlight: "realmente",
    h1After: "se responden.",
    description:
      "FormKiller convierte cuestionarios estáticos en conversaciones por voz que tu audiencia realmente termina. Más finalizaciones, respuestas más ricas y menos abandono.",
  },
  heroPrimary: "Solicita una demo a medida",
  heroSecondary: "Ver cómo funciona",
  videoPreview: {
    muteLabel: "Silenciar audio del video",
    unmuteLabel: "Activar audio del video",
  },
  mockForm: {
    stepLabel: "Paso 2 / 5",
    question:
      "¿Cuál es el objetivo principal que quieres lograr este trimestre?",
    buttons: [
      "Aumentar ingresos",
      "Reducir el churn",
      "Lanzar producto",
      "Contratar equipo",
    ],
  },
  stats: [
    {
      value: "3×",
      label: "mayor tasa de finalización que los formularios de texto",
    },
    { value: "< 60s", label: "para crear y publicar un formulario" },
    { value: "3", label: "idiomas admitidos" },
    { value: "0", label: "aplicaciones necesarias para responder" },
  ],
  featuresLabel: "Características",
  featuresH2Line1: "Todo lo que necesitas.",
  featuresH2Line2: "Nada más.",
  features: [
    {
      title: "Respuesta por voz",
      description:
        "Los participantes responden las preguntas con su voz. Transcripción automática de voz a texto, sin necesidad de escribir.",
    },
    {
      title: "Botones alternativos",
      description:
        "Botones de respuesta predefinidos junto con la entrada de voz. Elige el modo mixto, solo voz o solo botones por formulario.",
    },
    {
      title: "TTS generado por IA",
      description:
        "Las preguntas se leen en voz alta mediante síntesis de voz con IA, para que los participantes no tengan que leer nada.",
    },
    {
      title: "Captura de leads integrada",
      description:
        "Cada envío recoge automáticamente nombre, correo electrónico y teléfono al final de la conversación.",
    },
    {
      title: "Fondos multimedia",
      description:
        "Establece imágenes de fondo personalizadas y música ambiental en bucle para crear una experiencia inmersiva de marca.",
    },
    {
      title: "Multilingüe",
      description:
        "Formularios disponibles en inglés, italiano y español. El TTS y la interfaz se adaptan automáticamente al idioma seleccionado.",
    },
  ],
  howItWorksLabel: "Cómo funciona",
  howItWorksH2Line1: "De cero a publicado",
  howItWorksH2Line2: "en minutos.",
  steps: [
    {
      number: "01",
      title: "Crea tu formulario",
      description:
        "Ponle nombre a tu formulario, elige un idioma y añade tus preguntas. Elige cómo pueden responder los participantes: voz, botones o ambos.",
    },
    {
      number: "02",
      title: "Personaliza la experiencia",
      description:
        "Establece una imagen de fondo, música ambiental y un tema claro u oscuro. Genera locuciones de IA para cada pregunta.",
    },
    {
      number: "03",
      title: "Comparte el enlace",
      description:
        "Envía la URL única del formulario a los participantes. Lo completan en cualquier navegador — sin app, sin inicio de sesión.",
    },
    {
      number: "04",
      title: "Recoge los leads",
      description:
        "Supervisa sesiones y leads en el panel, con datos de contacto, transcripciones y respuestas de voz.",
    },
  ],
  modesLabel: "Modos de respuesta flexibles",
  modesH2Line1: "Tu formulario,",
  modesH2Line2: "tus reglas.",
  modesDescription:
    "Cada formulario puede configurarse para el canal y la audiencia que mejor se adapte a ti. Combina voz con botones predefinidos, ve totalmente conversacional o mantenlo clásico.",
  modesCheckItems: [
    "Voz + botones — lo mejor de ambos mundos",
    "Solo voz — completamente conversacional",
    "Solo botones — selección guiada",
  ],
  modeCards: [
    {
      label: "Mixto",
      sublabel: "Voz + Botones",
      desc: "Los participantes pueden hablar o tocar. Máxima flexibilidad para cualquier audiencia.",
    },
    {
      label: "Solo voz",
      sublabel: "Conversacional",
      desc: "Interacción de voz pura. Perfecta para investigación cualitativa y comentarios.",
    },
    {
      label: "Solo botones",
      sublabel: "Guiado",
      desc: "Solo opciones predefinidas. Ideal para encuestas rápidas y datos estructurados.",
    },
  ],
  ctaSectionH2Line1: "¿Necesitas un formulario",
  ctaSectionH2Line2: "de voz para tu funnel?",
  ctaSectionDescription:
    "Cuéntanos tu objetivo y te ayudamos a diseñar el flujo conversacional correcto.",
  ctaSectionFormTitle: "Formulario de contacto de FormKiller",
  ctaSectionFormUnavailable:
    "Configura CONTACT_FORM_USERNAME y CONTACT_FORM_SLUG para mostrar el formulario de contacto embebido.",
  cookieBanner: {
    title: "Este sitio utiliza cookies",
    description:
      "Usamos cookies tecnicas para mantener el sitio seguro y funcional y, con tu consentimiento, cookies analiticas para mejorar la experiencia.",
    accept: "Aceptar",
    reject: "Rechazar",
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} FormKiller. Todos los derechos reservados.`,
    signIn: "Iniciar sesión →",
    cookiePolicyLabel: "Politica de Cookies",
    cookiePolicyHref: "/es/cookie-policy",
    privacyPolicyLabel: "Politica de Privacidad",
    privacyPolicyHref: "/es/privacy-policy",
  },
};

export default function HomePageES() {
  return (
    <LandingPage
      content={content}
      contactFormUsername={contactFormUsername}
      contactFormSlug={contactFormSlug}
    />
  );
}
