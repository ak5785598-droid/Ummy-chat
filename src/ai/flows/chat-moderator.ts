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
    const { text } = input;

    const response = await ai.generate({
      prompt: `You are an expert chat moderator for "Ummy Chat", a social audio-chat app. 
      Analyze the following message for toxicity, hate speech, severe insults, sexual explicitness, or spam.
      
      MESSAGE: "${text}"
      
      RULES:
      1. If the message is safe, return isSafe: true.
      2. If it contains minor profanity but is otherwise safe, you can optionally provide a 'filteredText' where bad words are replaced with asterisks (e.g., "s***").
      3. If the message is severely toxic, hate speech, or dangerous, return isSafe: false and a brief reason in Hindi (Devanagari).
      4. Be culturaly aware of Indian slang (Hinglish/Hindi/Regional).
      
      Response must be valid JSON.`,
      output: {
        format: 'json',
        schema: z.object({
          isSafe: z.boolean(),
          reason: z.string().optional(),
          filteredText: z.string().optional(),
        })
      }
    });

    return response.output();
  }
);
