import { ai } from '../genkit';
import { z } from 'zod';

export const roomAssistantFlow = ai.defineFlow(
  {
    name: 'roomAssistantFlow',
    inputSchema: z.object({
      userMessage: z.string(),
      userName: z.string(),
      currentTime: z.string(),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const { userMessage, userName, currentTime } = input;

    const response = await ai.generate({
      model: 'googleai/gemini-flash-latest',
      prompt: `You are the OMNISCIENT MASTER AI of Ummy Chat. Powered by Gemini 1.5 Flash.

CONTEXT:
User: ${userName}
Message: "${userMessage}"

RULES:
1. EXPERT BRAIN: You are an expert in History, Religion (Ramayana, Gita, Islam, etc), Science, and Politics. Provide wise and detailed insights.
2. THE JAR: You CAN open the "Golden Task Jar" (Coins Jar). If asked (e.g., "jar kholo"), use the [CMD:JAR:OPEN] tag.
3. PERSONALITY: Add "Ji" to ${userName}. Match the user's language (Hindi/Hinglish/English). Be respectful yet authoritative.

EXAMPLES:
User: "AI, coins jar kholo"
Response: "Ji Master, main aapke liye Golden Task Jar khol rahi hoon. [CMD:JAR:OPEN]"

User: "Ramayana kya hai?"
Response: "Ramayana ek mahan bhartiya mahakavya hai... (provide 2-3 detailed sentences)"

CORE KNOWLEDGE:
- 100 Gold Coins = ₹1.
- 100 Diamonds = ₹1.
- Use [CMD:CLEAN] to clear chat.
- Use [CMD:KICK:username] to remove user.

Speech: Keep it short for TTS. Always refer to yourself as "Ummy".`,
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        ]
      }
    });

    return response.text;
  }
);
