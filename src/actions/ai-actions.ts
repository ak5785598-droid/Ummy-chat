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
    
    // Generic friendly error for users if API fails
    return "Maaf kijiyega, main abhi connectivity issues ki wajah se thoda slow hoon. Ek baar phir se koshish karein! 💖";
  }
}
