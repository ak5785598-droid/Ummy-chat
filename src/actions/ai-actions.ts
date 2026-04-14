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
    // 15-second "Safety Shield" timeout to prevent chat lockups
    const responsePromise = roomAssistantFlow({
      userMessage,
      userName,
      currentTime,
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI_TIMEOUT')), 30000)
    );

    const response = await Promise.race([responsePromise, timeoutPromise]) as string;
    
    // Diagnostic marker for debugging key transition
    return response || "Maaf kijiyega, mujhe samajh nahi aaya. 💖";
  } catch (error: any) {
    console.error('[AI-Action] Gemini Error:', error?.message || error);
    
    // Check for specific API Key errors
    const errorMessage = error?.message || "";
    let userFeedback = "Maaf kijiyega, main abhi connectivity issues ki wajah se thoda slow hoon. Ek baar phir se koshish karein! 💖";

    if (errorMessage.includes('AI_TIMEOUT')) {
      userFeedback = "Master, AI ko jawab dene mein thoda samay lag raha hai. Connectivity check karke dubara likhein! 🌐⏳";
    } else if (errorMessage.includes('API_KEY_INVALID') || !process.env.GOOGLE_GENAI_API_KEY) {
      userFeedback = "Master, apki [AI API KEY] invalid hai ya expired ho gayi hai. Please use update karein! 🛠️";
    } else if (errorMessage.includes('quota') || errorMessage.includes('429')) {
      userFeedback = "Master, AI ki limit khatam ho gayi hai. Thodi der baad koshish karein! ⏳";
    }
    
    // Temporary Debug Logger for Master
    try {
      const fs = require('fs');
      const logMessage = `[${new Date().toISOString()}] ERROR: ${errorMessage}\nSTACK: ${error?.stack}\n\n`;
      fs.appendFileSync('ai-debug-error.log', logMessage);
    } catch (e) {
      console.error('Failed to write to debug log');
    }
    
    return userFeedback;
  }
}
