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
    const response = await ai.generate({
      prompt: `Translate this message to ${input.targetLanguage}. Return ONLY the translated text.
Message: "${input.text}"`,
    });

    return response.text;
  }
);
