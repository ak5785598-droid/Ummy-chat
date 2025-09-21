'use server';

/**
 * @fileOverview This file defines a Genkit flow for searching YouTube videos.
 * It uses a tool to fetch video search results from an external API.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const YoutubeSearchInputSchema = z.string();
export type YoutubeSearchInput = z.infer<typeof YoutubeSearchInputSchema>;

const VideoSearchResultSchema = z.object({
  videoId: z.string().describe('The unique identifier for the YouTube video.'),
  title: z.string().describe('The title of the YouTube video.'),
  thumbnailUrl: z.string().url().describe('The URL for the video thumbnail image.'),
  channelTitle: z.string().describe('The name of the YouTube channel that uploaded the video.'),
});
export type VideoSearchResult = z.infer<typeof VideoSearchResultSchema>;

const YoutubeSearchOutputSchema = z.array(VideoSearchResultSchema);
export type YoutubeSearchOutput = z.infer<typeof YoutubeSearchOutputSchema>;

// This is our tool that Genkit can use. It calls the YouTube Search API.
const searchYoutubeTool = ai.defineTool(
  {
    name: 'searchYoutube',
    description: 'Search for YouTube videos based on a query.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: YoutubeSearchOutputSchema,
  },
  async ({ query }) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('Google API key is not configured.');
    }
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query
    )}&type=video&maxResults=6&key=${apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('YouTube API Error:', errorData);
        throw new Error(`YouTube API request failed with status: ${response.status}`);
      }
      const data = await response.json();

      return data.items.map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnailUrl: item.snippet.thumbnails.high.url,
        channelTitle: item.snippet.channelTitle,
      }));
    } catch (error) {
      console.error('Failed to fetch from YouTube API:', error);
      return [];
    }
  }
);

// This is the prompt that instructs the AI to use our search tool.
const searchPrompt = ai.definePrompt({
  name: 'youtubeSearchPrompt',
  input: { schema: YoutubeSearchInputSchema },
  output: { schema: YoutubeSearchOutputSchema },
  tools: [searchYoutubeTool],
  prompt: `Search YouTube for videos matching the query: {{{query}}}. Use the searchYoutube tool.`,
});

// This is the main flow that orchestrates the search.
const youtubeSearchFlow = ai.defineFlow(
  {
    name: 'youtubeSearchFlow',
    inputSchema: YoutubeSearchInputSchema,
    outputSchema: YoutubeSearchOutputSchema,
  },
  async (query) => {
    const { output } = await searchPrompt(query);
    return output || [];
  }
);


export async function searchYoutube(
  input: YoutubeSearchInput
): Promise<YoutubeSearchOutput> {
  return youtubeSearchFlow(input);
}
