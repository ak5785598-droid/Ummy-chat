'use server';

import { roomAssistantFlow } from '@/ai/flows/room-assistant';

export async function getUmmyAIResponse(userMessage: string, userName: string) {
  try {
    // Generate Current IST Time (GTM+5:30) for accurate AI responses
    const now = new Date();
    const currentTime = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'medium',
    }).format(now);

    const response = await roomAssistantFlow({
      userMessage,
      userName,
      currentTime,
    });
    return response || "Maaf kijiyega, mujhe samajh nahi aaya. 💖";
  } catch (error: any) {
    console.error('[AI-Action] Detailed Error:', error?.message || error);
    
    // Generic friendly error for users if API fails
    return "Maaf kijiyega, main abhi connectivity issues ki wajah se thoda slow hoon. Ek baar phir se koshish karein! 💖";
  }
}
