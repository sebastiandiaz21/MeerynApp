
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating images for spelling words using AI.
 *
 * - generateWordImage - A function that generates an image for a given word using the Gemini API.
 * - GenerateWordImageInput - The input type for the generateWordImage function.
 * - GenerateWordImageOutput - The return type for the generateWordImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWordImageInputSchema = z.object({
  word: z.string().describe('The word to generate an image for.'),
});
export type GenerateWordImageInput = z.infer<typeof GenerateWordImageInputSchema>;

const GenerateWordImageOutputSchema = z.object({
  imageUrl: z.string().describe('The URL of the generated image.'),
});
export type GenerateWordImageOutput = z.infer<typeof GenerateWordImageOutputSchema>;

export async function generateWordImage(input: GenerateWordImageInput): Promise<GenerateWordImageOutput> {
  return generateWordImageFlow(input);
}

const generateWordImageFlow = ai.defineFlow(
  {
    name: 'generateWordImageFlow',
    inputSchema: GenerateWordImageInputSchema,
    outputSchema: GenerateWordImageOutputSchema,
  },
  async (input: GenerateWordImageInput): Promise<GenerateWordImageOutput> => {
    const generationResult = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: `A child-friendly, simple, clear, photorealistic image representing only the word: "${input.word}". No text, letters, or complex scenes.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        safetySettings: [
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_ONLY_HIGH',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE', // Slightly relaxed
          },
        ],
      },
    });

    const imageUrl = generationResult.media?.url;

    if (!imageUrl) {
      console.error(`[generateWordImageFlow] Image generation failed for word: "${input.word}". No media URL returned from AI.`);
      // Fallback to a placeholder if AI provides no URL
      return { imageUrl: `https://placehold.co/600x400.png?text=AI+Img+Fail+${input.word.replace(/\s/g, '+')}` };
    }

    return { imageUrl };
  }
);

