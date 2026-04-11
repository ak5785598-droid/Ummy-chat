'use server';

import { roomAssistantFlow } from '@/ai/flows/room-assistant';

export async function getUmmyAIResponse(userMessage: string, userName: string) {
  // Generate Current IST Time (GTM+5:30) for accurate AI responses
  const now = new Date();
  const currentTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(now);

  try {
    // PRIMARY ATTEMPT: Gemini (Free Tier priority)
    const response = await roomAssistantFlow({
      userMessage,
      userName,
      currentTime,
      model: 'googleai/gemini-1.5-flash',
    });
    return response || "Maaf kijiyega, mujhe samajh nahi aaya. 💖";
  } catch (error: any) {
    console.warn('[AI-Action] Gemini Failed, attempting OpenAI fallback...', error?.message);
    
    try {
      // SECONDARY ATTEMPT: OpenAI ChatGPT Fallback
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_key_here') {
        throw new Error('OPENAI_API_KEY_MISSING');
      }

      const response = await roomAssistantFlow({
        userMessage,
        userName,
        currentTime,
        model: 'openai/gpt-4o-mini',
      });
      return response || "Maaf kijiyega, mujhe samajh nahi aaya. 💖";

    } catch (fallbackError: any) {
      console.error('[AI-Action] Both AI providers failed:', fallbackError?.message);
      
      const errorMessage = error?.message || "";
      let userFeedback = "Maaf kijiyega, main abhi connectivity issues ki wajah se thoda slow hoon. Ek baar phir se koshish karein! 💖";

      if (errorMessage.includes('API_KEY_INVALID')) {
        userFeedback = "Master, apki [Gemini API KEY] invalid hai. Please use check karein! 🛠️";
      } else if (fallbackError?.message === 'OPENAI_API_KEY_MISSING') {
        userFeedback = "Master, Gemini quota khatam hai aur [OpenAI API KEY] skip kar di gayi hai. Please key update karein! 🔑";
      } else if (errorMessage.includes('quota') || errorMessage.includes('429')) {
        userFeedback = "Master, AI ki limit khatam ho gayi hai aur backup bhi fail ho gaya. Thodi der baad koshish karein! ⏳";
      }
      
      return userFeedback;
    }
  }
}
