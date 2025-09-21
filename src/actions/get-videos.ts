
'use server';

import {
  searchYoutubeVideos,
} from '@/ai/flows/youtube-video-search';
import { isConfigured } from '@/ai/tools/youtube-search';

export async function searchVideosAction(query: string) {
  if (!isConfigured()) {
    return {
      success: false,
      error: 'The YouTube API key is not configured. Please set the YOUTUBE_API_KEY environment variable.',
    };
  }
  try {
    const result = await searchYoutubeVideos({ query });
    return { success: true, data: result.results };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      error: `Failed to search for videos. ${errorMessage}`,
    };
  }
}
