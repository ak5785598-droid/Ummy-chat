import { ai } from '../genkit';
import { z } from 'zod';

export const chatModeratorFlow = ai.defineFlow(
  {
    name: 'chatModeratorFlow',
    inputSchema: z.object({
      text: z.string(),
    }),
    outputSchema: z.object({
      isSafe: z.boolean(),
      reason: z.string().optional(),
      filteredText: z.string().optional(),
    }),
  },
  async (input) => {
    const response = await ai.generate({
      prompt: `Analyze this message for toxicity, hate speech, spam, and profanity.
Return JSON: { "isSafe": true/false, "reason": "brief reason", "filteredText": "cleaned text" }
Message: "${input.text}"`,
    });

    try {
      const parsed = JSON.parse(response.text);
      return {
        isSafe: parsed.isSafe ?? true,
        reason: parsed.reason || '',
        filteredText: parsed.filteredText || input.text,
      };
    } catch {
      return { isSafe: true, reason: '', filteredText: input.text };
    }
  }
);
