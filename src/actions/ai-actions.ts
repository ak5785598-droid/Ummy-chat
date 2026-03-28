'use server';

import { roomAssistantFlow } from '@/ai/flows/room-assistant';

export async function getUmmyAIResponse(userMessage: string, userName: string) {
  try {
    const response = await roomAssistantFlow({
      userMessage,
      userName,
    });
    return response || "Maaf kijiyega, mujhe samajh nahi aaya. 💖";
  } catch (error) {
    console.error('[AI-Action] Error:', error);
    return "Ummy AI abhi thoda busy hai, baad me baat karte hain! 😊";
  }
}
