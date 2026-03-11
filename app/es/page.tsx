import LandingPage, { LandingContent } from "@/app/_components/landing-page";

const content: LandingContent = {
  nav: {
    signIn: "Iniciar sesión",
    getStarted: "Empezar gratis",
  },
  hero: {
    badge: "Formularios conversacionales por voz",
    h1Before: "Formularios que",
    h1Highlight: "realmente",
    h1After: "se responden.",
    description:
      "FormKiller transforma los cuestionarios estáticos en conversaciones inmersivas basadas en voz. Mayores tasas de finalización, respuestas más ricas, cero fricción.",
  },
  heroPrimary: "Crea tu primer formulario",
  heroSecondary: "Ver cómo funciona",
  mockForm: {
    stepLabel: "Paso 2 / 5",
    question: "¿Cuál es el objetivo principal que quieres lograr este trimestre?",
    buttons: ["Aumentar ingresos", "Reducir el churn", "Lanzar producto", "Contratar equipo"],
  },
  stats: [
    { value: "3×", label: "mayor tasa de finalización que los formularios de texto" },
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
        "Consulta cada sesión y lead en el panel de control. Exporta respuestas y datos de contacto cuando los necesites.",
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
  ctaSectionH2Line1: "¿Listo para acabar con",
  ctaSectionH2Line2: "los formularios aburridos?",
  ctaSectionDescription:
    "Crea tu primer formulario de voz en menos de un minuto. Sin tarjeta de crédito.",
  ctaSectionButton: "Empezar gratis",
  footer: {
    copyright: `© ${new Date().getFullYear()} FormKiller. Todos los derechos reservados.`,
    signIn: "Iniciar sesión →",
  },
};

export default function HomePageES() {
  return <LandingPage content={content} />;
}
