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
    
    // Check for specific API Key errors
    const errorMessage = error?.message || "";
    let userFeedback = "Maaf kijiyega, main abhi connectivity issues ki wajah se thoda slow hoon. Ek baar phir se koshish karein! 💖";

    if (errorMessage.includes('API_KEY_INVALID') || !process.env.GOOGLE_GENAI_API_KEY) {
      userFeedback = "Master, apki [AI API KEY] invalid hai ya expired ho gayi hai. Please use update karein! 🛠️";
    } else if (errorMessage.includes('quota') || errorMessage.includes('429')) {
      userFeedback = "Master, AI ki limit khatam ho gayi hai. Thodi der baad koshish karein! ⏳";
    }
    
    return userFeedback;
  }
}
