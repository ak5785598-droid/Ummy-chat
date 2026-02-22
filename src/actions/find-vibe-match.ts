
'use server';

/**
 * @fileOverview AI Vibe Matching Action.
 * Uses Genkit to find a room or user that matches the user's interests.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VibeMatchInputSchema = z.object({
  interests: z.string().describe('User interests or bio.'),
  mood: z.string().describe('Current mood of the user.'),
});
export type VibeMatchInput = z.infer<typeof VibeMatchInputSchema>;

const VibeMatchOutputSchema = z.object({
  id: z.string().describe('Firestore ID of the matched room or user.'),
  type: z.enum(['Room', 'User']).describe('Type of match.'),
  reasoning: z.string().describe('Why this match was made.'),
  vibeTag: z.string().describe('A catchy name for this match vibe.'),
  commonInterests: z.array(z.string()).describe('Shared interests between user and match.'),
  roomName: z.string().optional(),
  userName: z.string().optional(),
});
export type VibeMatchOutput = z.infer<typeof VibeMatchOutputSchema>;

export async function findVibeMatchAction(input: VibeMatchInput) {
  try {
    const result = await findVibeMatchFlow(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Match Error:', error);
    return { success: false, error: 'Failed to find a vibe match.' };
  }
}

const prompt = ai.definePrompt({
  name: 'vibeMatchPrompt',
  input: { schema: VibeMatchInputSchema },
  output: { schema: VibeMatchOutputSchema },
  prompt: `You are the Ummy Neural Matching Engine. Your job is to find the perfect "tribe" for a user based on their vibe.

  User Interests: {{{interests}}}
  User Mood: {{{mood}}}

  Instructions:
  1. Generate a "Real" sounding match. Since we are in a prototype phase, you should hallucinate a high-quality match that would fit this user.
  2. Provide a compelling "Reasoning" that explains why this match is perfect for them.
  3. Include a catchy "vibeTag" (e.g., "Neon Dreamers", "Lo-Fi Soul", "Indie Rebels").
  4. List 3 specific shared interests.
  5. The 'id' should be a realistic Firestore ID (alphanumeric string).

  Be creative, warm, and encourage the user to join the tribe.
  `,
});

const findVibeMatchFlow = ai.defineFlow(
  {
    name: 'findVibeMatchFlow',
    inputSchema: VibeMatchInputSchema,
    outputSchema: VibeMatchOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
