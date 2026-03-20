import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  generateCompletionAnalysisOutputSchema,
  generateFormOutputSchema,
} from "@/lib/ai/schema";
import { FormLanguage } from "@/features/forms/schema";
import type {
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
  return value.trim();
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
