import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { openAI } from '@genkit-ai/compat-oai/openai';

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }),
    openAI({ apiKey: process.env.OPENAI_API_KEY }),
  ],
  model: 'googleai/gemini-1.5-flash',
});
