'use server';

/**
 * @fileOverview Production AI Vibe Matching Engine.
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
 prompt: `You are the Ummy Social Graph Engine. Your job is to connect tribe members based on their interests and current mood.

 User Interests: {{{interests}}}
 User Mood: {{{mood}}}

 Instructions:
 1. Analyze the input to find a high-fidelity social match.
 2. Provide professional "Reasoning" that explains the connection.
 3. Include an evocative "vibeTag" (e.g., "Neon Dreamers", "Midnight Soul").
 4. Identify 3 specific common grounds.
 5. Generate a realistic Firestore document ID.

 Be encouraging and community-focused.
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
