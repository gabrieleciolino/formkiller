import { generateFormSchema } from "@/lib/ai/schema";
import { z } from "zod";

export type GenerateFormType = z.infer<typeof generateFormSchema>;
