import { ai } from '../genkit';
import { z } from 'zod';

export const generateThemeCssFlow = ai.defineFlow(
  {
    name: 'generateThemeCssFlow',
    inputSchema: z.object({
      prompt: z.string(),
    }),
    outputSchema: z.object({
      themeName: z.string(),
      backgroundColor: z.string(),
      backgroundImage: z.string(),
      animationCss: z.string(),
      particleColor: z.string()
    }),
  },
  async (input) => {
    const { prompt } = input;

    const response = await ai.generate({
      prompt: `You are an expert UI/UX visual architect for "Ummy Chat" rooms.
      Translate the following user theme request/prompt into a beautiful, premium set of CSS styles (using gorgeous gradients, shadows, and keyframe animations) that can be applied dynamically.
      
      THEME PROMPT:
      "${prompt}"
      
      REQUIREMENTS:
      1. themeName: Give the generated theme a cool, premium, uppercase name (e.g. "NEON SHADOWS", "CYBER GLITCH", "GOLDEN ROYALTY").
      2. backgroundColor: A dark, premium hex code (e.g., #0a0518, #030712) to serve as a baseline.
      3. backgroundImage: A highly premium, complex CSS gradient (e.g., "linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #030712 100%)" or multi-layered radial-gradients). Keep it dark and glossy.
      4. animationCss: Extra raw CSS styles including @keyframes to make the background feel alive (e.g., slowly shifting gradient positions, soft pulsing glow filters). Wrap these under a class name ".room-architect-theme" or custom animation classes.
      5. particleColor: A vibrant matching hex color for ambient floating particles (e.g. #ff007f, #00ffff).
      
      Return the output as a strict, clean JSON object matching this structure:
      {
        "themeName": "...",
        "backgroundColor": "...",
        "backgroundImage": "...",
        "animationCss": "...",
        "particleColor": "..."
      }
      
      Do NOT include any markdown code blocks or additional text. Just return the JSON object string.`,
    });

    const cleanJson = response.text.replace(/```json|```/g, '').trim();
    try {
      return JSON.parse(cleanJson);
    } catch (e) {
      // Fallback in case of JSON parse glitch
      return {
        themeName: "AI AMBIENCE",
        backgroundColor: "#09090b",
        backgroundImage: "linear-gradient(to bottom, #111827, #09090b)",
        animationCss: "",
        particleColor: "#f43f5e"
      };
    }
  }
);
