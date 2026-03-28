'use server';

import { roomAssistantFlow } from '@/ai/flows/room-assistant';

export async function getUmmyAIResponse(userMessage: string, userName: string) {
  try {
    const response = await roomAssistantFlow({
      userMessage,
      userName,
    });
    return response || "Maaf kijiyega, mujhe samajh nahi aaya. 💖";
  } catch (error: any) {
    console.error('[AI-Action] Detailed Error:', error?.message || error);
    
    // Diagnostic check for API key
    if (!process.env.GOOGLE_GENAI_API_KEY) {
       console.error('[AI-Action] CRITICAL: GOOGLE_GENAI_API_KEY is missing from environment.');
    }
    
    return "Ummy AI abhi thoda busy hai, baad me baat karte hain! 😊";
  }
}
