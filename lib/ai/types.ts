import {
  generateAnalysisInstructionsOutputSchema,
  generateCompletionAnalysisOutputSchema,
  generateTestCarouselOutputSchema,
  generateFormOutputSchema,
  generateFormSchema,
  generateViralTestOutputSchema,
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
export type GenerateViralTestOutputType = z.infer<
  typeof generateViralTestOutputSchema
>;
export type GenerateTestCarouselOutputType = z.infer<
  typeof generateTestCarouselOutputSchema
>;
