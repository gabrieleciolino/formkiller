import type { Metadata } from "next";

export type LegalLocale = "en" | "it" | "es";
export type LegalDocument = "privacy" | "cookie";

interface LegalSection {
  title: string;
  paragraphs: string[];
  items?: string[];
}

export interface LegalCopy {
  title: string;
  metaDescription: string;
  intro: string;
  lastUpdatedLabel: string;
  lastUpdatedValue: string;
  backToHomeLabel: string;
  sections: LegalSection[];
}

const LEGAL_CONTENT: Record<LegalLocale, Record<LegalDocument, LegalCopy>> = {
  en: {
    privacy: {
      title: "Privacy Policy",
      metaDescription:
        "Learn how FormKiller collects, uses, and protects personal data.",
      intro:
        "This Privacy Policy explains how FormKiller processes personal data when you browse our website, request a demo, or use our services.",
      lastUpdatedLabel: "Last updated",
      lastUpdatedValue: "March 13, 2026",
      backToHomeLabel: "Back to home",
      sections: [
        {
          title: "Data controller",
          paragraphs: [
            "FormKiller acts as data controller for personal data collected through this website and related business operations.",
            "For privacy requests you can contact us at privacy@formkiller.com.",
          ],
        },
        {
          title: "Data we collect",
          paragraphs: [
            "We may collect contact data such as name, email, phone number, company information, and any details you provide in messages or demo requests.",
            "We also collect technical data such as IP address, browser details, device data, and usage events needed to secure and improve the platform.",
          ],
        },
        {
          title: "How we use personal data",
          paragraphs: [
            "We process data to provide the service, respond to requests, deliver support, comply with legal obligations, and prevent abuse.",
            "With consent, we may use analytics data to measure performance and improve product quality.",
          ],
        },
        {
          title: "Retention and sharing",
          paragraphs: [
            "We retain personal data only for the time required for the purposes described in this policy or to meet legal obligations.",
            "Data may be shared with vetted service providers acting on our instructions, including hosting, infrastructure, analytics, and communication providers.",
          ],
        },
        {
          title: "Your rights",
          paragraphs: [
            "Depending on applicable law, you can request access, correction, deletion, restriction, portability, or objection to processing.",
            "You can also withdraw consent at any time where processing is based on consent.",
          ],
        },
      ],
    },
    cookie: {
      title: "Cookie Policy",
      metaDescription:
        "Learn how FormKiller uses cookies and similar technologies.",
      intro:
        "This Cookie Policy explains what cookies are, how FormKiller uses them, and how you can manage your preferences.",
      lastUpdatedLabel: "Last updated",
      lastUpdatedValue: "March 13, 2026",
      backToHomeLabel: "Back to home",
      sections: [
        {
          title: "What cookies are",
          paragraphs: [
            "Cookies are small text files stored on your device by your browser when you visit a website.",
            "They help websites remember preferences, maintain sessions, and improve user experience.",
          ],
        },
        {
          title: "Cookies we use",
          paragraphs: [
            "We use strictly necessary cookies required for core functions such as security, authentication, and language/session handling.",
            "With your consent, we may use analytics cookies to understand traffic and product usage.",
          ],
          items: [
            "Essential cookies: always active, required for security and functionality.",
            "Preference cookies: remember choices such as language when available.",
            "Analytics cookies: optional, used only after consent.",
          ],
        },
        {
          title: "Consent choices",
          paragraphs: [
            "When you first visit the site, you can accept or reject optional cookies through the banner.",
            "Your choice is stored in a consent cookie and can be changed at any time by clearing cookies in your browser.",
          ],
        },
        {
          title: "How to control cookies",
          paragraphs: [
            "Most browsers allow you to block or delete cookies in settings. Disabling essential cookies may impact website functionality.",
            "For details, consult your browser help pages.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            "If you have questions about this policy, contact us at privacy@formkiller.com.",
          ],
        },
      ],
    },
  },
  it: {
    privacy: {
      title: "Privacy Policy",
      metaDescription:
        "Scopri come FormKiller raccoglie, usa e protegge i dati personali.",
      intro:
        "Questa Privacy Policy descrive come FormKiller tratta i dati personali quando navighi sul sito, richiedi una demo o usi i nostri servizi.",
      lastUpdatedLabel: "Ultimo aggiornamento",
      lastUpdatedValue: "13 marzo 2026",
      backToHomeLabel: "Torna alla home",
      sections: [
        {
          title: "Titolare del trattamento",
          paragraphs: [
            "FormKiller agisce come titolare del trattamento per i dati personali raccolti tramite questo sito e le attivita connesse.",
            "Per richieste privacy puoi contattarci a privacy@formkiller.com.",
          ],
        },
        {
          title: "Dati raccolti",
          paragraphs: [
            "Possiamo raccogliere dati di contatto come nome, email, numero di telefono, azienda e qualsiasi informazione inviata tramite form o richieste demo.",
            "Raccogliamo anche dati tecnici come indirizzo IP, informazioni su browser/dispositivo ed eventi di utilizzo necessari per sicurezza e miglioramento del servizio.",
          ],
        },
        {
          title: "Finalita del trattamento",
          paragraphs: [
            "Trattiamo i dati per erogare il servizio, rispondere alle richieste, fornire supporto, adempiere obblighi legali e prevenire abusi.",
            "Con il consenso, possiamo usare dati analitici per misurare le performance e migliorare il prodotto.",
          ],
        },
        {
          title: "Conservazione e condivisione",
          paragraphs: [
            "Conserviamo i dati personali solo per il tempo necessario alle finalita indicate in questa informativa o per obblighi di legge.",
            "I dati possono essere condivisi con fornitori qualificati che agiscono per nostro conto, inclusi provider di hosting, infrastruttura, analytics e comunicazioni.",
          ],
        },
        {
          title: "Diritti dell'interessato",
          paragraphs: [
            "In base alla normativa applicabile puoi richiedere accesso, rettifica, cancellazione, limitazione, portabilita o opposizione al trattamento.",
            "Puoi anche revocare il consenso in qualsiasi momento quando il trattamento si basa sul consenso.",
          ],
        },
      ],
    },
    cookie: {
      title: "Cookie Policy",
      metaDescription:
        "Scopri come FormKiller utilizza cookie e tecnologie simili.",
      intro:
        "Questa Cookie Policy spiega cosa sono i cookie, come FormKiller li utilizza e come puoi gestire le tue preferenze.",
      lastUpdatedLabel: "Ultimo aggiornamento",
      lastUpdatedValue: "13 marzo 2026",
      backToHomeLabel: "Torna alla home",
      sections: [
        {
          title: "Cosa sono i cookie",
          paragraphs: [
            "I cookie sono piccoli file di testo che il browser salva sul tuo dispositivo quando visiti un sito web.",
            "Aiutano il sito a ricordare preferenze, mantenere sessioni attive e migliorare l'esperienza utente.",
          ],
        },
        {
          title: "Cookie utilizzati",
          paragraphs: [
            "Utilizziamo cookie strettamente necessari per funzioni essenziali come sicurezza, autenticazione e gestione lingua/sessione.",
            "Con il tuo consenso, possiamo usare cookie analitici per capire traffico e utilizzo del prodotto.",
          ],
          items: [
            "Cookie essenziali: sempre attivi, necessari per sicurezza e funzionalita.",
            "Cookie di preferenza: memorizzano scelte come la lingua quando disponibile.",
            "Cookie analitici: opzionali, attivati solo dopo consenso.",
          ],
        },
        {
          title: "Gestione del consenso",
          paragraphs: [
            "Alla prima visita puoi accettare o rifiutare i cookie opzionali tramite il banner.",
            "La tua scelta viene salvata in un cookie di consenso e puo essere modificata in qualsiasi momento cancellando i cookie dal browser.",
          ],
        },
        {
          title: "Come controllare i cookie",
          paragraphs: [
            "La maggior parte dei browser permette di bloccare o eliminare i cookie dalle impostazioni. Disattivare i cookie essenziali puo compromettere il funzionamento del sito.",
            "Per maggiori dettagli consulta la guida del tuo browser.",
          ],
        },
        {
          title: "Contatti",
          paragraphs: [
            "Per domande su questa informativa puoi contattarci a privacy@formkiller.com.",
          ],
        },
      ],
    },
  },
  es: {
    privacy: {
      title: "Politica de Privacidad",
      metaDescription:
        "Descubre como FormKiller recopila, usa y protege los datos personales.",
      intro:
        "Esta Politica de Privacidad explica como FormKiller trata los datos personales cuando visitas el sitio, solicitas una demo o usas nuestros servicios.",
      lastUpdatedLabel: "Ultima actualizacion",
      lastUpdatedValue: "13 de marzo de 2026",
      backToHomeLabel: "Volver al inicio",
      sections: [
        {
          title: "Responsable del tratamiento",
          paragraphs: [
            "FormKiller actua como responsable del tratamiento de los datos personales recogidos a traves de este sitio y de las operaciones relacionadas.",
            "Para solicitudes de privacidad puedes escribir a privacy@formkiller.com.",
          ],
        },
        {
          title: "Datos que recopilamos",
          paragraphs: [
            "Podemos recopilar datos de contacto como nombre, correo, telefono, empresa y cualquier informacion enviada en formularios o solicitudes de demo.",
            "Tambien recopilamos datos tecnicos como direccion IP, informacion del navegador/dispositivo y eventos de uso necesarios para seguridad y mejora del servicio.",
          ],
        },
        {
          title: "Como usamos los datos",
          paragraphs: [
            "Tratamos los datos para prestar el servicio, responder solicitudes, ofrecer soporte, cumplir obligaciones legales y prevenir abusos.",
            "Con consentimiento, podemos usar datos analiticos para medir rendimiento y mejorar el producto.",
          ],
        },
        {
          title: "Conservacion y cesion",
          paragraphs: [
            "Conservamos los datos personales solo durante el tiempo necesario para las finalidades indicadas en esta politica o para cumplir obligaciones legales.",
            "Los datos pueden compartirse con proveedores verificados que actuan por cuenta nuestra, incluidos servicios de hosting, infraestructura, analitica y comunicaciones.",
          ],
        },
        {
          title: "Tus derechos",
          paragraphs: [
            "Segun la normativa aplicable puedes solicitar acceso, rectificacion, supresion, limitacion, portabilidad u oposicion al tratamiento.",
            "Tambien puedes retirar tu consentimiento en cualquier momento cuando el tratamiento se base en dicho consentimiento.",
          ],
        },
      ],
    },
    cookie: {
      title: "Politica de Cookies",
      metaDescription:
        "Descubre como FormKiller utiliza cookies y tecnologias similares.",
      intro:
        "Esta Politica de Cookies explica que son las cookies, como FormKiller las utiliza y como puedes gestionar tus preferencias.",
      lastUpdatedLabel: "Ultima actualizacion",
      lastUpdatedValue: "13 de marzo de 2026",
      backToHomeLabel: "Volver al inicio",
      sections: [
        {
          title: "Que son las cookies",
          paragraphs: [
            "Las cookies son pequenos archivos de texto que el navegador guarda en tu dispositivo cuando visitas un sitio web.",
            "Ayudan al sitio a recordar preferencias, mantener sesiones y mejorar la experiencia de usuario.",
          ],
        },
        {
          title: "Cookies que usamos",
          paragraphs: [
            "Usamos cookies estrictamente necesarias para funciones esenciales como seguridad, autenticacion y gestion de idioma/sesion.",
            "Con tu consentimiento, podemos usar cookies analiticas para entender trafico y uso del producto.",
          ],
          items: [
            "Cookies esenciales: siempre activas, necesarias para seguridad y funcionalidad.",
            "Cookies de preferencia: recuerdan elecciones como idioma cuando esta disponible.",
            "Cookies analiticas: opcionales, solo se activan tras el consentimiento.",
          ],
        },
        {
          title: "Eleccion de consentimiento",
          paragraphs: [
            "En tu primera visita puedes aceptar o rechazar cookies opcionales mediante el banner.",
            "Tu eleccion se guarda en una cookie de consentimiento y puedes cambiarla en cualquier momento eliminando cookies en el navegador.",
          ],
        },
        {
          title: "Como controlar cookies",
          paragraphs: [
            "La mayoria de los navegadores permite bloquear o eliminar cookies desde configuracion. Desactivar cookies esenciales puede afectar el funcionamiento del sitio.",
            "Para mas informacion, revisa la ayuda de tu navegador.",
          ],
        },
        {
          title: "Contacto",
          paragraphs: [
            "Si tienes dudas sobre esta politica, escribenos a privacy@formkiller.com.",
          ],
        },
      ],
    },
  },
};

export function getLegalContent(locale: LegalLocale, document: LegalDocument) {
  return LEGAL_CONTENT[locale][document];
}

export function getLegalMetadata(
  locale: LegalLocale,
  document: LegalDocument,
): Metadata {
  const copy = getLegalContent(locale, document);

  return {
    title: `FormKiller | ${copy.title}`,
    description: copy.metaDescription,
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function getLegalHomePath(locale: LegalLocale) {
  if (locale === "en") {
    return "/";
  }

  return `/${locale}`;
}
