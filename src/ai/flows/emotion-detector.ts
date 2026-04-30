import { ai } from '../genkit';
import { z } from 'zod';

export const emotionDetectorFlow = ai.defineFlow(
  {
    name: 'emotionDetectorFlow',
    inputSchema: z.object({
      text: z.string(),
    }),
    outputSchema: z.object({
      emotion: z.enum(['happy', 'angry', 'sad', 'surprised', 'normal']),
      emoji: z.string(),
    }),
  },
  async (input) => {
    const { text } = input;

    const response = await ai.generate({
      prompt: `Analyze the emotional tone of this chat message: "${text}". 
      Categorize it into one of these: happy, angry, sad, surprised, or normal.
      
      Return ONLY a JSON object: {"emotion": "category", "emoji": "one_matching_emoji"}.`,
    });

    try {
      // Clean up potential markdown blocks from AI response
      const cleanText = response.text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanText);
    } catch (e) {
      return { emotion: 'normal', emoji: '💬' };
    }
  }
);
