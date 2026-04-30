'use server';

import { roomAssistantFlow } from '@/ai/flows/room-assistant';
import { chatModeratorFlow } from '@/ai/flows/chat-moderator';
import { chatTranslatorFlow } from '@/ai/flows/chat-translator';
import { emotionDetectorFlow } from '@/ai/flows/emotion-detector';

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
      setTimeout(() => reject(new Error('AI_TIMEOUT')), 15000)
    );

    const response = await Promise.race([responsePromise, timeoutPromise]) as string;
    
    // Diagnostic marker for debugging key transition
    console.log('✅ [AI-SUCCESS]: Message generated successfully for', userName);
    return response || "Maaf kijiyega Master, main iska jawab dene mein asamarth hoon. 💖";
  } catch (error: any) {
    const fs = require('fs');
    const errorMessage = error?.message || "Unknown Error";
    
    // MASTER: SEE THIS IN YOUR TERMINAL!
    console.log('\n\n❌❌❌ [GEMINI ERROR DETECTED] ❌❌❌');
    console.error('ERROR MESSAGE:', errorMessage);
    console.error('MODEL:', 'googleai/gemini-flash-latest');
    console.error('API KEY (First 5):', process.env.GOOGLE_GENAI_API_KEY?.substring(0, 5));
    console.log('---------------------------------------\n\n');
    
    // Log to file for master
    try {
      const logMessage = `[${new Date().toISOString()}] ERROR: ${errorMessage}\nMODEL: gemini-flash-latest\nSTACK: ${error?.stack}\n\n`;
      fs.appendFileSync('ai-debug-error.log', logMessage);
    } catch (e) {}

    let userFeedback = "Maaf kijiyega, main abhi connectivity issues ki wajah se thoda slow hoon. Ek baar phir se koshish karein! 💖";

    if (errorMessage.includes('AI_TIMEOUT')) {
      userFeedback = "Master, AI ko jawab dene mein thoda samay lag raha hai. Connectivity check karke dubara likhein! 🌐⏳";
    } else if (errorMessage.includes('API_KEY_INVALID') || !process.env.GOOGLE_GENAI_API_KEY) {
      userFeedback = "Master, apki [AI API KEY] invalid hai ya expired ho gayi hai. Please use update karein! 🛠️";
    } else if (errorMessage.includes('quota') || errorMessage.includes('429')) {
      userFeedback = "Master, AI ki limit khatam ho gayi hai. Thodi der baad koshish karein! ⏳";
    } else if (errorMessage.includes('404')) {
      userFeedback = "Master, AI model configuration mein error hai. Please wait karein jab tak main ise theek karta hoon! 🛠️";
    }
    
    return userFeedback;
  }
}

export async function moderateMessage(text: string) {
  try {
    const result = await chatModeratorFlow({ text });
    return result;
  } catch (error) {
    console.error('Moderation Error:', error);
    return { isSafe: true };
  }
}

/**
 * Detects the emotional tone of a message.
 */
export async function detectEmotion(text: string) {
  try {
    const result = await emotionDetectorFlow({ text });
    return result;
  } catch (e) {
    return { emotion: 'normal' as const, emoji: '💬' };
  }
}

export async function translateMessage(text: string, targetLanguage: string = 'Hindi') {
  try {
    const result = await chatTranslatorFlow({ text, targetLanguage });
    return result;
  } catch (error) {
    console.error('Translation Error:', error);
    return null;
  }
}

