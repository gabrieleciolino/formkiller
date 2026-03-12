import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  generateAnalysisInstructionsOutputSchema,
  generateCompletionAnalysisOutputSchema,
  generateFormOutputSchema,
} from "@/lib/ai/schema";
import {
  ANALYSIS_PROMPT_MAX_CHARS,
  ANALYSIS_PROMPT_MAX_WORDS,
  FormLanguage,
} from "@/features/forms/schema";
import type {
  GenerateAnalysisInstructionsOutputType,
  GenerateCompletionAnalysisOutputType,
  GenerateFormOutputType,
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
  const trimmed = value.trim();
  const byChars = trimmed.slice(0, ANALYSIS_PROMPT_MAX_CHARS);
  const words = byChars.split(/\s+/).filter((token) => token.trim().length > 0);

  if (words.length <= ANALYSIS_PROMPT_MAX_WORDS) {
    return byChars;
  }

  return words.slice(0, ANALYSIS_PROMPT_MAX_WORDS).join(" ");
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
        Massimo ${ANALYSIS_PROMPT_MAX_WORDS} parole o ${ANALYSIS_PROMPT_MAX_CHARS} caratteri.

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
  lead,
  answers,
}: {
  language: FormLanguage;
  formName: string;
  analysisInstructions: string;
  lead: { name: string; email: string; phone: string };
  answers: Array<{ order: number; question: string; response: string }>;
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

  const { output } = await generateText({
    model: openai("gpt-5-mini"),
    prompt: `
        Scrivi un commento finale per l'utente del form "${formName}".
        Deve essere breve, conciso, discorsivo, senza sezioni o bullet point.
        Usa solo le risposte disponibili, senza inventare dettagli.
        Massimo ${ANALYSIS_PROMPT_MAX_WORDS} parole o ${ANALYSIS_PROMPT_MAX_CHARS} caratteri.

        Lingua: ${getLanguageName(language)}.
        Istruzione di analisi: ${normalizedAnalysisInstructions}
        Utente: ${lead.name} (${lead.email}, ${lead.phone})
        Risposte: ${answersText}
    `,
    output: Output.object({
      schema: generateCompletionAnalysisOutputSchema,
    }),
  });

  return normalizeAnalysisPrompt(output.analysis);
};
