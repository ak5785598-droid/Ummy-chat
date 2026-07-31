import { ai } from '../genkit';
import { z } from 'zod';

export const emotionDetectorFlow = ai.defineFlow(
  {
    name: 'emotionDetectorFlow',
    inputSchema: z.object({
      text: z.string(),
    }),
    outputSchema: z.object({
      emotion: z.string(),
      emoji: z.string(),
      confidence: z.number().optional(),
    }),
  },
  async (input) => {
    const response = await ai.generate({
      prompt: `Detect the emotional tone of this message.
Return JSON: { "emotion": "happy|angry|sad|surprised|normal", "emoji": "single emoji", "confidence": 0.0-1.0 }
Message: "${input.text}"`,
    });

    try {
      const parsed = JSON.parse(response.text);
      return {
        emotion: parsed.emotion || 'normal',
        emoji: parsed.emoji || '😐',
        confidence: parsed.confidence ?? 0.5,
      };
    } catch {
      return { emotion: 'normal', emoji: '😐', confidence: 0.5 };
    }
  }
);
