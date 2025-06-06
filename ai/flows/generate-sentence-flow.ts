
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a simple sentence using a given word.
 *
 * - generateSentenceForWord - A function that calls the generateSentenceFlow.
 * - GenerateSentenceInput - The input type for the generateSentenceForWord function.
 * - GenerateSentenceOutput - The return type for the generateSentenceForWord function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSentenceInputSchema = z.object({
  word: z.string().describe('The word to use in a sentence.'),
});
export type GenerateSentenceInput = z.infer<typeof GenerateSentenceInputSchema>;

const GenerateSentenceOutputSchema = z.object({
  sentence: z.string().describe('A simple sentence using the provided word.'),
});
export type GenerateSentenceOutput = z.infer<
  typeof GenerateSentenceOutputSchema
>;

export async function generateSentenceForWord(
  input: GenerateSentenceInput
): Promise<GenerateSentenceOutput> {
  return generateSentenceFlow(input);
}

const generateSentencePrompt = ai.definePrompt({
  name: 'generateSentencePrompt',
  input: {schema: GenerateSentenceInputSchema},
  output: {schema: GenerateSentenceOutputSchema},
  prompt: `Create one simple and short English sentence using the word "{{word}}". The sentence should be easy to understand for a child learning to spell. Provide only the sentence itself, with no introductory phrases or extra text.`,
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

const generateSentenceFlow = ai.defineFlow(
  {
    name: 'generateSentenceFlow',
    inputSchema: GenerateSentenceInputSchema,
    outputSchema: GenerateSentenceOutputSchema,
  },
  async input => {
    const {output} = await generateSentencePrompt(input);
    return output!;
  }
);
