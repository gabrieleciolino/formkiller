import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { generateFormSchema } from "@/lib/ai/schema";

export const generateForm = async ({
  instructions,
}: {
  instructions: string;
}) => {
  const { output } = await generateText({
    model: openai("gpt-5-mini"),
    prompt: `
        Genera un questionario sulla base degli argomenti e degli scopi forniti 
        nelle istruzioni dell'utente. Minimo 5 domande, massimo 10. 
        Fornisci per ogni domanda, le 4 risposte più comuni.

        Istruzioni utente: ${instructions}
    `,
    output: Output.object({
      schema: generateFormSchema,
    }),
  });

  return output;
};
