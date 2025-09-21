
'use server';
/**
 * @fileOverview A tool for searching YouTube videos using the YouTube Data API.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

function isConfigured(): boolean {
  return !!YOUTUBE_API_KEY;
}

const YoutubeSearchToolInputSchema = z.object({
  query: z.string().describe('The search term to look for on YouTube.'),
});

const YoutubeSearchToolOutputSchema = z.object({
  results: z.array(
    z.object({
      videoId: z.string(),
      title: z.string(),
      thumbnailUrl: z.string(),
    })
  ),
});

export const searchYoutubeVideosTool = ai.defineTool(
  {
    name: 'searchYoutubeVideosTool',
    description: 'Searches for YouTube videos based on a query.',
    inputSchema: YoutubeSearchToolInputSchema,
    outputSchema: YoutubeSearchToolOutputSchema,
  },
  async (input) => {
    if (!isConfigured()) {
      throw new Error('YouTube API key is not configured.');
    }

    const searchQuery = encodeURIComponent(input.query);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&maxResults=9&key=${YOUTUBE_API_KEY}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `YouTube API request failed: ${errorData.error.message}`
        );
      }
      const data = await response.json();

      const results = data.items.map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnailUrl: item.snippet.thumbnails.high.url,
      }));

      return { results };
    } catch (error) {
      console.error('Error fetching from YouTube API:', error);
      throw new Error('Failed to fetch video data from YouTube.');
    }
  }
);
