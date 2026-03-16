import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  generateAnalysisInstructionsOutputSchema,
  generateCompletionAnalysisOutputSchema,
  generateFormOutputSchema,
  generateViralTestOutputSchema,
} from "@/lib/ai/schema";
import { FormLanguage } from "@/features/forms/schema";
import {
  TEST_MAX_QUESTIONS,
  TEST_MIN_QUESTIONS,
  TEST_PROFILES_COUNT,
  type TestResultType,
  type TestTone,
} from "@/features/tests/schema";
import type {
  GenerateAnalysisInstructionsOutputType,
  GenerateCompletionAnalysisOutputType,
  GenerateFormOutputType,
  GenerateViralTestOutputType,
} from "@/lib/ai/types";

const getLanguageName = (language: FormLanguage) => {
  switch (language) {
    case "it":
      return "italiano";
    case "es":
      return "spagnolo";
    case "en":
    default:
      return "inglese";
  }
};

const normalizeAnalysisPrompt = (value: string) => {
  return value.trim();
};

const getTestToneInstructions = (tone: TestTone) => {
  switch (tone) {
    case "educational":
      return `
      TONO SELEZIONATO: DIVULGATIVO / INFORMATIVO
      - Usa un linguaggio chiaro, accessibile e utile.
      - Mantieni ritmo e coinvolgimento, ma evita meme e provocazioni gratuite.
      - Privilegia domande concrete che aiutino a riflettere o imparare qualcosa.
      `;
    case "serious":
      return `
      TONO SELEZIONATO: SERIO / RIFLESSIVO
      - Usa un tono sobrio, rispettoso e credibile.
      - Evita ironia eccessiva, slang aggressivo e copy troppo leggero.
      - Punta su introspezione, consapevolezza e chiarezza.
      `;
    case "professional":
      return `
      TONO SELEZIONATO: PROFESSIONALE
      - Usa linguaggio professionale, chiaro e orientato all'azione.
      - Evita stile meme, clickbait forzato o toni adolescenziali.
      - Domande e risultati devono essere utili in contesti lavoro/business/crescita personale.
      `;
    case "fun":
    default:
      return `
      TONO SELEZIONATO: DIVERTENTE / VIRALE
      - Mantieni tono pop, brillante, social-first e shareable.
      - Autoironia e leggerezza sono incoraggiate, senza diventare offensivi.
      `;
  }
};

const getTestResultTypeInstructions = (resultType: TestResultType) => {
  if (resultType === "analysis") {
    return `
      TIPO RISULTATO: ANALISI GENERALE DELLE RISPOSTE
      - L'utente finale ricevera una sintesi generale, non una singola etichetta profilo.
      - Genera comunque ${TEST_PROFILES_COUNT} profili interni e punteggi coerenti per supportare l'analisi finale.
      - Evita nomi profilo troppo caricaturali o meme.
    `;
  }

  return `
    TIPO RISULTATO: PROFILO FINALE (1 su ${TEST_PROFILES_COUNT})
    - L'utente finale deve ricevere un profilo chiaro, riconoscibile e condivisibile.
    - I nomi profilo possono essere più identitari e memorabili.
  `;
};

export const generateForm = async ({
  instructions,
  language,
}: {
  instructions: string;
  language: FormLanguage;
}): Promise<GenerateFormOutputType> => {
  const { output } = await generateText({
    model: openai("gpt-5-mini"),
    prompt: `
        Genera un questionario sulla base degli argomenti e degli scopi forniti
        nelle istruzioni dell'utente.

        Restituisci SEMPRE:
        - introTitle: titolo schermata iniziale
        - introMessage: messaggio schermata iniziale (1-3 frasi)
        - endTitle: titolo schermata finale
        - endMessage: messaggio schermata finale (1-3 frasi)
        - questions: da 5 a 10 domande, ciascuna con 4 risposte comuni

        Genera domande e risposte nella seguente lingua: ${getLanguageName(language)}
        Genera anche intro e fine nella stessa lingua.

        Istruzioni utente: ${instructions}
    `,
    output: Output.object({
      schema: generateFormOutputSchema,
    }),
  });

  return output;
};

export const generateFormAnalysisInstructions = async ({
  language,
  formInstructions,
  additionalPrompt,
  questions,
}: {
  language: FormLanguage;
  formInstructions: string;
  additionalPrompt: string;
  questions: Array<{
    order: number;
    question: string;
    defaultAnswers: Array<{ order: number; answer: string }>;
  }>;
}): Promise<GenerateAnalysisInstructionsOutputType["analysisInstructions"]> => {
  const normalizedAdditionalPrompt = normalizeAnalysisPrompt(additionalPrompt);
  const questionsText = questions
    .map((question, index) => {
      const answersText = question.defaultAnswers
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((answer) => `- ${answer.answer}`)
        .join("\n");

      return `${index + 1}. ${question.question}\nRisposte predefinite:\n${answersText}`;
    })
    .join("\n\n");

  const { output } = await generateText({
    model: openai("gpt-5-mini"),
    prompt: `
        Scrivi SOLO un'istruzione breve per guidare l'analisi finale.
        Deve produrre un testo breve, conciso e discorsivo.
        Niente sezioni o elenchi, niente diagnosi, niente invenzioni.
        Interpreta solo le risposte disponibili.

        Lingua: ${getLanguageName(language)}.
        Contesto form: ${formInstructions}
        Prompt admin: ${normalizedAdditionalPrompt || "Nessun prompt aggiuntivo"}
        Domande: ${questionsText}
    `,
    output: Output.object({
      schema: generateAnalysisInstructionsOutputSchema,
    }),
  });

  return normalizeAnalysisPrompt(output.analysisInstructions);
};

export const generateCompletionAnalysis = async ({
  language,
  formName,
  analysisInstructions,
  answers,
  lead,
}: {
  language: FormLanguage;
  formName: string;
  analysisInstructions: string;
  answers: Array<{ order: number; question: string; response: string }>;
  lead?: { name: string; email: string; phone: string };
}): Promise<GenerateCompletionAnalysisOutputType["analysis"]> => {
  const normalizedAnalysisInstructions =
    normalizeAnalysisPrompt(analysisInstructions);
  const answersText = answers
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(
      (answer, index) =>
        `${index + 1}. Domanda: ${answer.question}\nRisposta utente: ${answer.response}`,
    )
    .join("\n\n");
  const leadContext = lead
    ? `${lead.name} (${lead.email}, ${lead.phone})`
    : "Non disponibile";

  const { output } = await generateText({
    model: openai("gpt-5-mini"),
    prompt: `
        Scrivi un commento finale per l'utente del form "${formName}".
        Deve essere breve, conciso, discorsivo, senza sezioni o bullet point.
        Usa solo le risposte disponibili, senza inventare dettagli.

        Lingua: ${getLanguageName(language)}.
        Istruzione di analisi: ${normalizedAnalysisInstructions}
        Utente: ${leadContext}
        Risposte: ${answersText}
    `,
    output: Output.object({
      schema: generateCompletionAnalysisOutputSchema,
    }),
  });

  return normalizeAnalysisPrompt(output.analysis);
};

export const generateViralTest = async ({
  additionalPrompt,
  existingTestsDigest,
  language,
  questionsCount,
  tone,
  resultType,
}: {
  additionalPrompt: string;
  existingTestsDigest: string;
  language: FormLanguage;
  questionsCount: number;
  tone: TestTone;
  resultType: TestResultType;
}): Promise<GenerateViralTestOutputType> => {
  const normalizedQuestionsCount = Math.min(
    TEST_MAX_QUESTIONS,
    Math.max(TEST_MIN_QUESTIONS, Math.trunc(questionsCount)),
  );
  const normalizedAdditionalPrompt = additionalPrompt.trim();

  const { output } = await generateText({
    model: openai("gpt-5.1"),
    prompt: `
      Sei un autore specializzato in test interattivi per social media e funnel digitali.
      Il tuo obiettivo è creare un test che le persone vogliano iniziare subito, completare fino in fondo e trovare utile.

      Crea un test con queste caratteristiche:

      CONFIGURAZIONE
      ${getTestToneInstructions(tone)}
      ${getTestResultTypeInstructions(resultType)}

      OBIETTIVO
      - Il test deve essere molto chiaro, coinvolgente e facile da capire.
      - Deve sembrare contemporaneo e rilevante per il pubblico target.
      - Adatta stile, lessico e profondita in base al tono selezionato.
      - Il risultato finale deve essere credibile, coerente e utile.

      STILE GENERALE
      - Mantieni uno stile coerente con il tono selezionato.
      - Linguaggio semplice e diretto, adatto alla fruizione mobile.
      - Evita incoerenze di registro (es. tono professionale con slang meme).

      TITOLO DEL TEST
      - Il campo "name" deve essere corto, forte e molto curioso.
      - Deve sembrare il titolo di un test che uno cliccherebbe subito.
      - Meglio se contiene una tensione identitaria, una provocazione o una domanda diretta.
      - Evita titoli generici o neutri.

      DOMANDE
      - Esattamente ${normalizedQuestionsCount} domande.
      - Ogni domanda deve essere breve, chiara, istantaneamente comprensibile.
      - Ogni domanda deve funzionare bene su schermo mobile.
      - Ogni domanda deve sembrare personale, concreta, attuale.
      - Evita domande astratte, fredde o accademiche.
      - Evita formulazioni tipo "Come reagisci generalmente..." o "Quale delle seguenti affermazioni...".
      - Le domande migliori sono dirette, tipo:
        - "Quando ti ignorano, che fai?"
        - "Se hai un piano, lo segui davvero?"
        - "Quando ti piace qualcuno, si capisce subito?"
      - Ogni domanda deve spingere la persona a riconoscersi rapidamente.

      RISPOSTE
      - Ogni domanda deve avere esattamente 4 risposte.
      - Le risposte devono essere brevi, distintive, memorabili.
      - Devono sembrare opzioni con personalità, non varianti quasi uguali.
      - Ogni risposta deve rappresentare un atteggiamento chiaro e diverso.
      - Le risposte devono essere scritte come parlerebbe una persona vera o come un meme leggero.
      - Evita risposte lunghe, spiegate o troppo simili tra loro.
      - Evita risposte tutte positive o tutte neutre.
      - Almeno alcune risposte dovrebbero essere un po’ autoironiche, impulsive, eccessive o spudoratamente sincere.

      PROFILI FINALI
      - Esattamente ${TEST_PROFILES_COUNT} profili finali.
      - Ogni profilo deve avere titolo e descrizione breve.
      - I profili devono essere:
        - riconoscibili
        - coerenti con il tono scelto
        - condivisibili
        - utili all'interpretazione del risultato
      - Ogni profilo deve avere una personalità chiara e diversa.
      - Evita descrizioni vaghe o generiche.

      SCORES
      - Ogni risposta deve avere "scores" con 4 interi non negativi, uno per ogni profilo.
      - I punteggi devono essere distribuiti in modo sensato e distintivo.
      - Evita score piatti o troppo simmetrici.
      - Ogni risposta dovrebbe favorire chiaramente 1 profilo principale e, al massimo, 1 secondario.
      - Non assegnare punteggi alti a tutti i profili insieme.
      - Le risposte devono aiutare davvero a distinguere i risultati finali.

      INTRO E FINALE
      - "introTitle" e "introMessage" devono invogliare a iniziare subito.
      - "endTitle" e "endMessage" devono dare una sensazione di payoff, come se il risultato meritasse di essere letto e condiviso.
      - Il finale deve sembrare social-friendly.

      COSA EVITARE ASSOLUTAMENTE
      - tono da test scolastico
      - tono clinico o terapeutico
      - domande lunghe o noiose
      - risposte banali tipo "dipende", "a volte", "in base al contesto"
      - profili troppo generici
      - linguaggio corporate
      - contenuti moralisti
      - frasi da biscotto della fortuna
      - risultati troppo positivi e piatti
      - contenuti che sembrano scritti per un blog del 2016

      CRITERIO DI QUALITÀ
      Il test finale deve sembrare:
      - immediato da capire
      - difficile da ignorare
      - divertente da completare
      - abbastanza vero da essere condiviso
      - abbastanza pungente da essere ricordato

      ANTI-RIPETIZIONE (OBBLIGATORIO)
      - Di seguito trovi un digest ultra-compatto dei test già creati.
      - Non ripetere titolo, hook principale, angolo narrativo o archetipi già presenti.
      - Se un concetto è molto vicino a quelli sotto, cambia direzione in modo netto.
      - Devi produrre un concept nuovo.

      TEST ESISTENTI (DIGEST COMPATTO)
      ${existingTestsDigest || "Nessuno"}

      Lingua di output: ${getLanguageName(language)}.
      Prompt aggiuntivo admin: ${normalizedAdditionalPrompt || "Nessuno"}
    `,
    output: Output.object({
      schema: generateViralTestOutputSchema,
    }),
  });

  return output;
};
