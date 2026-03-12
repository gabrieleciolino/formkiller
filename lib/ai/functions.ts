import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { generateFormOutputSchema } from "@/lib/ai/schema";
import { FormLanguage } from "@/features/forms/schema";
import type { GenerateFormOutputType } from "@/lib/ai/types";

export const generateForm = async ({
  instructions,
  language,
}: {
  instructions: string;
  language: FormLanguage;
}): Promise<GenerateFormOutputType> => {
  const languageSwitcher = () => {
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

        Genera domande e risposte nella seguente lingua: ${languageSwitcher()}
        Genera anche intro e fine nella stessa lingua.

        Istruzioni utente: ${instructions}
    `,
    output: Output.object({
      schema: generateFormOutputSchema,
    }),
  });

  return output;
};
