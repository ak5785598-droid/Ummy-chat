import { ai } from '../genkit';
import { z } from 'zod';

export const chatTranslatorFlow = ai.defineFlow(
  {
    name: 'chatTranslatorFlow',
    inputSchema: z.object({
      text: z.string(),
      targetLanguage: z.string().default('Hindi'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const { text, targetLanguage } = input;

    const response = await ai.generate({
      prompt: `You are a professional universal translator for "Ummy Chat". 
      Translate the following text to ${targetLanguage}. 
      
      TEXT: "${text}"
      
      REQUIREMENTS:
      1. Detect the source language automatically.
      2. Keep the tone social and friendly.
      3. If the text is already in ${targetLanguage}, just return it as is.
      4. For Indian regional languages (Tamil, Telugu, etc.), translate accurately to ${targetLanguage}.
      5. Return ONLY the translated text, nothing else.`,
    });

    return response.text;
  }
);
