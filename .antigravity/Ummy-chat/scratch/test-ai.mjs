
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testAI() {
  console.log('Testing AI with key:', process.env.GOOGLE_GENAI_API_KEY?.substring(0, 5) + '...');
  
  const ai = genkit({
    plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
    model: 'googleai/gemini-1.5-flash',
  });

  try {
    const response = await ai.generate('Hello, are you working?');
    console.log('Response:', response.text);
  } catch (err) {
    console.error('Error details:', err.message || err);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
  }
}

testAI();
