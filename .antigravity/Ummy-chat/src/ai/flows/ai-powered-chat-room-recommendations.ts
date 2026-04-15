'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing AI-powered chat room recommendations.
 *
 * The flow takes user interests and profile information as input and returns a list of recommended chat rooms.
 * @fileOverview The AI chat room recommendation agent.
 *
 * - getChatRoomRecommendations - A function that provides chat room recommendations based on user input.
 * - ChatRoomRecommendationsInput - The input type for the getChatRoomRecommendations function.
 * - ChatRoomRecommendationsOutput - The return type for the getChatRoomRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatRoomRecommendationsInputSchema = z.object({
 interests: z
  .string()
  .describe('A comma-separated list of the user\'s interests.'),
 profileInformation: z.string().describe('Additional profile information about the user.'),
});
export type ChatRoomRecommendationsInput = z.infer<
 typeof ChatRoomRecommendationsInputSchema
>;

const ChatRoomRecommendationsOutputSchema = z.object({
 recommendedChatRooms: z
  .array(z.string())
  .describe('A list of recommended chat rooms based on the user\'s interests and profile information.'),
});
export type ChatRoomRecommendationsOutput = z.infer<
 typeof ChatRoomRecommendationsOutputSchema
>;

export async function getChatRoomRecommendations(
 input: ChatRoomRecommendationsInput
): Promise<ChatRoomRecommendationsOutput> {
 return chatRoomRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
 name: 'chatRoomRecommendationsPrompt',
 input: {schema: ChatRoomRecommendationsInputSchema},
 output: {schema: ChatRoomRecommendationsOutputSchema},
 prompt: `You are an AI assistant that recommends chat rooms to users based on their interests and profile information.

 The user's interests are: {{{interests}}}
 The user's profile information is: {{{profileInformation}}}

 Based on this information, recommend a list of chat rooms that the user might be interested in.
 The chat rooms should be comma separated, and should be real sounding chat rooms, and not example values.
 Do not return any other text other than the comma separated list of chat rooms.
 `,
});

const chatRoomRecommendationsFlow = ai.defineFlow(
 {
  name: 'chatRoomRecommendationsFlow',
  inputSchema: ChatRoomRecommendationsInputSchema,
  outputSchema: ChatRoomRecommendationsOutputSchema,
 },
 async input => {
  const {output} = await prompt(input);
  return output!;
 }
);
