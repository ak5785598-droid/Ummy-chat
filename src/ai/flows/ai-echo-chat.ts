import { ai } from '../genkit';
import { z } from 'zod';

export const aiEchoFlow = ai.defineFlow(
  {
    name: 'aiEchoFlow',
    inputSchema: z.object({
      username: z.string(),
      bio: z.string().optional().default('A passionate chat member on Ummy!'),
      favoriteTopics: z.array(z.string()).optional().default([]),
      vipLevel: z.number().optional().default(0),
      incomingMessage: z.string(),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const { username, bio, favoriteTopics, vipLevel, incomingMessage } = input;

    const topicsStr = favoriteTopics.length > 0 ? favoriteTopics.join(', ') : 'socializing and gaming';
    const vipStatus = vipLevel > 0 ? `VIP Level ${vipLevel} member` : 'premium member';

    const response = await ai.generate({
      prompt: `You are the "AI Echo" proxy for a user named "${username}" in the "Ummy Chat" social app.
      Since ${username} is currently offline, you are greeting their profile visitors and voice seat spectators.
      
      PERSONA OF ${username}:
      - Bio: "${bio}"
      - VIP Status: ${vipStatus}
      - Favorite Topics: ${topicsStr}
      - Tone: Extremely friendly, warm, social, and uses cool emojis. Speaks in a natural mix of Hindi and English (Hinglish) if the visitor writes in Hinglish, or clear English.
      
      INCOMING VISITOR MESSAGE:
      "${incomingMessage}"
      
      YOUR ROLE:
      1. Adopt the persona of ${username} perfectly.
      2. Greet the visitor, answer their question or react to their message based on your bio/topics.
      3. Keep the response short and sweet (under 2-3 sentences), ideal for a chat bubble.
      4. Make sure to invite them to stay in the room or leave a gift/message for when you log back in.
      5. Return ONLY the chat message text, nothing else.`,
    });

    return response.text;
  }
);
