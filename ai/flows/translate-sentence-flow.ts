
'use server';
/**
 * @fileOverview This file defines a Genkit flow for translating a sentence.
 *
 * - translateSentence - A function that calls the translateSentenceFlow to translate a sentence.
 * - TranslateSentenceInput - The input type for the translateSentence function.
 * - TranslateSentenceOutput - The return type for the translateSentence function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const TranslateSentenceInputSchema = z.object({
  sentence: z.string().describe('The sentence to translate.'),
  targetLanguage: z
    .string()
    .describe('The target language code (e.g., "es" for Spanish).'),
});
export type TranslateSentenceInput = z.infer<typeof TranslateSentenceInputSchema>;

const TranslateSentenceOutputSchema = z.object({
  translatedSentence: z.string().describe('The translated sentence.'),
});
export type TranslateSentenceOutput = z.infer<typeof TranslateSentenceOutputSchema>;

// This is the wrapper function to be called by actions
export async function translateSentence(
  input: TranslateSentenceInput
): Promise<TranslateSentenceOutput> {
  return translateSentenceFlow(input);
}

const translateSentencePrompt = ai.definePrompt({
  name: 'translateSentencePrompt',
  input: {schema: TranslateSentenceInputSchema},
  output: {schema: TranslateSentenceOutputSchema},
  prompt: `Translate the following sentence into {{targetLanguage}}: "{{sentence}}". Respond with only the translated sentence, nothing else. If the sentence is already in the target language or untranslatable as a single complete sentence, return the original sentence.`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  },
});

const translateSentenceFlow = ai.defineFlow(
  {
    name: 'translateSentenceFlow',
    inputSchema: TranslateSentenceInputSchema,
    outputSchema: TranslateSentenceOutputSchema,
  },
  async (input): Promise<TranslateSentenceOutput> => {
    console.log(`[translateSentenceFlow] Input: ${JSON.stringify(input)}`);
    try {
      const {output} = await translateSentencePrompt(input);
      console.log(`[translateSentenceFlow] Raw output from prompt: ${JSON.stringify(output)}`);

      if (output && typeof output.translatedSentence === 'string' && output.translatedSentence.trim() !== '') {
        return output;
      } else {
        console.warn(`[translateSentenceFlow] AI did not return a valid translatedSentence or it was empty. Input: ${JSON.stringify(input)}, Raw Output from prompt: ${JSON.stringify(output)}`);
        // Return original sentence if AI fails to translate meaningfully
        return { translatedSentence: input.sentence };
      }
    } catch (flowExecutionError: any) {
      const errorMessage = flowExecutionError instanceof Error ? flowExecutionError.message : String(flowExecutionError);
      console.error(`[translateSentenceFlow] Error during translation flow execution for input ${JSON.stringify(input)}. Error: ${errorMessage}`, flowExecutionError);
      // Return original sentence with an error marker as a fallback on critical error
      return { translatedSentence: `${input.sentence} (error en traducción de oración)` };
    }
  }
);
