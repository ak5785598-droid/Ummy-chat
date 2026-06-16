
'use server';
/**
 * @fileOverview A tool for searching YouTube videos using the YouTube Data API.
 * COST FIX: In-memory cache with 1-hour TTL to avoid API quota exhaustion.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const youtubeCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour

function getCached(query: string) {
 const cached = youtubeCache.get(query);
 if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
  return cached.data;
 }
 youtubeCache.delete(query);
 return null;
}

function setCache(query: string, data: any) {
 // Limit cache size to 200 entries
 if (youtubeCache.size > 200) {
  const oldestKey = youtubeCache.keys().next().value;
  if (oldestKey) youtubeCache.delete(oldestKey);
 }
 youtubeCache.set(query, { data, timestamp: Date.now() });
}

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

  // COST FIX: Check cache first
  const cached = getCached(input.query.toLowerCase());
  if (cached) {
   console.log(`[YouTube] Cache hit for: "${input.query}"`);
   return cached;
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

   const output = { results };

   // COST FIX: Cache for 1 hour
   setCache(input.query.toLowerCase(), output);

   return output;
  } catch (error) {
   console.error('Error fetching from YouTube API:', error);
   throw new Error('Failed to fetch video data from YouTube.');
  }
 }
);
