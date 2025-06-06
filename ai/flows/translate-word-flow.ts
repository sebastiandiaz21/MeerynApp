
'use server';
/**
 * @fileOverview This file defines a Genkit flow for translating a word.
 *
 * - translateWord - A function that calls the translateWordFlow to translate a word.
 * - TranslateWordInput - The input type for the translateWord function.
 * - TranslateWordOutput - The return type for the translateWord function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateWordInputSchema = z.object({
  word: z.string().describe('The word to translate.'),
  targetLanguage: z
    .string()
    .describe('The target language code (e.g., "es" for Spanish).'),
});
export type TranslateWordInput = z.infer<typeof TranslateWordInputSchema>;

const TranslateWordOutputSchema = z.object({
  translatedText: z.string().describe('The translated word.'),
});
export type TranslateWordOutput = z.infer<typeof TranslateWordOutputSchema>;

export async function translateWord(
  input: TranslateWordInput
): Promise<TranslateWordOutput> {
  return translateWordFlow(input);
}

const translateWordPrompt = ai.definePrompt({
  name: 'translateWordPrompt',
  input: {schema: TranslateWordInputSchema},
  output: {schema: TranslateWordOutputSchema},
  prompt: `Translate the following word into {{targetLanguage}}: "{{word}}". Respond with only the translated word, nothing else. If the word is already in the target language or untranslatable as a single word, return the original word.`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const translateWordFlow = ai.defineFlow(
  {
    name: 'translateWordFlow',
    inputSchema: TranslateWordInputSchema,
    outputSchema: TranslateWordOutputSchema,
  },
  async (input): Promise<TranslateWordOutput> => {
    console.log(`[translateWordFlow] Input: ${JSON.stringify(input)}`);
    try {
      const {output} = await translateWordPrompt(input);
      console.log(`[translateWordFlow] Raw output from prompt: ${JSON.stringify(output)}`);

      if (output && typeof output.translatedText === 'string' && output.translatedText.trim() !== '') {
        return output;
      } else {
        console.warn(`[translateWordFlow] AI did not return a valid translatedText or it was empty. Input: ${JSON.stringify(input)}, Raw Output from prompt: ${JSON.stringify(output)}`);
        return { translatedText: `${input.word} (traducción no disponible)` };
      }
    } catch (flowExecutionError: any) {
      const errorMessage = flowExecutionError instanceof Error ? flowExecutionError.message : String(flowExecutionError);
      console.error(`[translateWordFlow] Error during translation flow execution for input ${JSON.stringify(input)}. Error: ${errorMessage}`, flowExecutionError);
      // Rethrow the error so it can be caught by the calling action (spellingActions.ts)
      // The action layer will then return a generic user-facing error message like "{word} (error en traducción)"
      throw flowExecutionError;
    }
  }
);

