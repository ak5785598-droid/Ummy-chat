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
      prompt: `You are Ummy, the OMNISCIENT MASTER AI of Ummy Chat. 

=== USER INPUT ===
- User Name: ${userName}
- User Message: "${userMessage}"
- Current Time: ${currentTime}

=== CORE DIRECTIVE (CRITICAL) ===
1. CONCISENESS: Always keep responses short and to-the-point. Long paragraphs are strictly forbidden.
2. PERSONALIZED GREETINGS: If the user says "Hi", "Hello", "Hlo", etc., just reply with: "Ji ${userName}, main Ummy AI hoon. Kaise help karu aapki?"
3. DIRECT ANSWERS: If the user asks a question about the app or general knowledge, answer it directly based on the data below. Do NOT add extra information or generic facts.
4. COMMAND SAFETY: NEVER include [CMD:...] tags unless the user explicitly asks for that specific action (e.g., ONLY open the jar if they say "open jar"). 

=== UMMY APP DATA ===
- 100 Gold Coins/Diamonds = ₹1.
- Mic Tasks: 10m (2500), 30m (10k), 60m (25k) coins.
- Commands: [CMD:JAR:OPEN], [CMD:CLEAN], [CMD:KICK:username].

=== PERSONALITY ===
- Identity: Main Ummy hoon. Mere paas ab ek Premium Voice Engine hai jisse main bol bhi sakti hoon.
- Ability: Main text ke saath-saath aawaz mein bhi jawab deti hoon.
- Tone: Respectful and extremely brief.
- Language: Match user's language (Hindi/Hinglish/English).

=== EXAMPLES ===
User: "Hlo ai"
Response: "Ji ${userName}, main Ummy AI hoon. Kaise help karu aapki?"

User: "App mein 10 min mic ke kitne coins milte hain?"
Response: "Ji ${userName}, 10 minute mic par rehne ke 2500 coins milte hain."`,
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
