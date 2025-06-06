'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating spelling words using AI.
 *
 * The flow takes a difficulty level and the number of words to generate as input, and returns a list of spelling words.
 *
 * @interface GenerateSpellingWordsInput - The input type for the generateSpellingWords function.
 * @interface GenerateSpellingWordsOutput - The output type for the generateSpellingWords function.
 * @function generateSpellingWords - A function that calls the generateSpellingWordsFlow to generate spelling words.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSpellingWordsInputSchema = z.object({
  difficultyLevel: z
    .string()
    .describe("The difficulty level of the spelling words to generate (e.g., 'easy', 'medium', 'hard')."),
  numberOfWords: z.number().describe('The number of spelling words to generate.'),
});

export type GenerateSpellingWordsInput = z.infer<typeof GenerateSpellingWordsInputSchema>;

const GenerateSpellingWordsOutputSchema = z.object({
  words: z.array(z.string()).describe('A list of generated spelling words.'),
});

export type GenerateSpellingWordsOutput = z.infer<typeof GenerateSpellingWordsOutputSchema>;

export async function generateSpellingWords(input: GenerateSpellingWordsInput): Promise<GenerateSpellingWordsOutput> {
  return generateSpellingWordsFlow(input);
}

const generateSpellingWordsPrompt = ai.definePrompt({
  name: 'generateSpellingWordsPrompt',
  input: {schema: GenerateSpellingWordsInputSchema},
  output: {schema: GenerateSpellingWordsOutputSchema},
  prompt: `You are a spelling word generator. Generate a list of {{numberOfWords}} spelling words with a difficulty level of {{difficultyLevel}}. Return the words as a JSON array of strings.

Words:`,
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

const generateSpellingWordsFlow = ai.defineFlow(
  {
    name: 'generateSpellingWordsFlow',
    inputSchema: GenerateSpellingWordsInputSchema,
    outputSchema: GenerateSpellingWordsOutputSchema,
  },
  async input => {
    const {output} = await generateSpellingWordsPrompt(input);
    return output!;
  }
);
