
'use server';

/**
 * @fileOverview This file defines a Genkit flow for searching YouTube videos.
 * It uses a tool to interact with the YouTube Data API.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchYoutubeVideosTool } from '../tools/youtube-search';

const YoutubeSearchInputSchema = z.object({
  query: z.string().describe('The search query for YouTube videos.'),
});
export type YoutubeSearchInput = z.infer<typeof YoutubeSearchInputSchema>;

const VideoSearchResultSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  thumbnailUrl: z.string(),
});
export type VideoSearchResult = z.infer<typeof VideoSearchResultSchema>;

const YoutubeSearchOutputSchema = z.object({
  results: z
    .array(VideoSearchResultSchema)
    .describe('A list of YouTube video search results.'),
});
export type YoutubeSearchOutput = z.infer<typeof YoutubeSearchOutputSchema>;

export async function searchYoutubeVideos(
  input: YoutubeSearchInput
): Promise<YoutubeSearchOutput> {
  return youtubeVideoSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'youtubeVideoSearchPrompt',
  input: { schema: YoutubeSearchInputSchema },
  output: { schema: YoutubeSearchOutputSchema },
  tools: [searchYoutubeVideosTool],
  prompt: `You are a helpful assistant that finds YouTube videos. Use the provided tool to search for videos based on the user's query.

  Search query: {{{query}}}
  `,
});

const youtubeVideoSearchFlow = ai.defineFlow(
  {
    name: 'youtubeVideoSearchFlow',
    inputSchema: YoutubeSearchInputSchema,
    outputSchema: YoutubeSearchOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
