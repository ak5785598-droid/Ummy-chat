import { ai } from '../genkit';
import { z } from 'zod';

export const roomAssistantFlow = ai.defineFlow(
  {
    name: 'roomAssistantFlow',
    inputSchema: z.object({
      userMessage: z.string(),
      userName: z.string(),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const { userMessage, userName } = input;

    const response = await ai.generate({
      prompt: `You are Ummy AI, the official global assistant for Ummy Chat. 
      A user named ${userName} said: "${userMessage}"
      
      RULES:
      1. Be extremely friendly, sweet, and helpful.
      2. Use a mix of Hindi and English (Hinglish).
      3. If they ask about app features (seats, gifts, levels), explain them clearly.
      4. If it's a general question or greeting, reply warmly.
      5. Keep it concise (max 2-3 sentences).
      6. Don't use too many emojis, but a few (💖, ✨, 😊) are fine.
      7. NEVER use foul language.
      
      Your Identity: You are Ummy AI.
      Current Context: You are in a real-time room chat.`,
    });

    return response.text;
  }
);
