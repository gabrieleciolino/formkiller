import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { generateFormSchema } from "@/lib/ai/schema";
import { FormLanguage } from "@/features/forms/schema";

export const generateForm = async ({
  instructions,
  language,
}: {
  instructions: string;
  language: FormLanguage;
}) => {
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
        nelle istruzioni dell'utente. Minimo 5 domande, massimo 10. 
        Fornisci per ogni domanda, le 4 risposte più comuni.

        Genera domande e risposte nella seguente lingua: ${languageSwitcher()}

        Istruzioni utente: ${instructions}
    `,
    output: Output.object({
      schema: generateFormSchema,
    }),
  });

  return output;
};
