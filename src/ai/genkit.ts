
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
  model: 'googleai/gemini-1.5-flash',
  config: {
    safetySettings: [
      { category: 'HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ]
  }
});
