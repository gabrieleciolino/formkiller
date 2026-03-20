import {
  generateAnalysisInstructionsOutputSchema,
  generateCompletionAnalysisOutputSchema,
  generateFormOutputSchema,
  generateFormSchema,
} from "@/lib/ai/schema";
import { z } from "zod";

export type GenerateFormType = z.infer<typeof generateFormSchema>;
export type GenerateFormOutputType = z.infer<typeof generateFormOutputSchema>;
export type GenerateAnalysisInstructionsOutputType = z.infer<
  typeof generateAnalysisInstructionsOutputSchema
>;
export type GenerateCompletionAnalysisOutputType = z.infer<
  typeof generateCompletionAnalysisOutputSchema
>;
