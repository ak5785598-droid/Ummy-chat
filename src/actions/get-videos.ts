
'use server';

import {
 searchYoutubeVideos,
} from '@/ai/flows/youtube-video-search';

// This function is no longer needed as the check is now internal to the tool.
// The `isConfigured` check is now performed within the `searchYoutubeVideosTool`.

export async function searchVideosAction(query: string) {
 // A check for the API key now happens inside the search tool itself.
 // If the key is missing, the tool will throw an error which will be caught below.
 try {
  const result = await searchYoutubeVideos({ query });
  return { success: true, data: result.results };
 } catch (error) {
  console.error(error);
  const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
  
  // Provide a more user-friendly error if the API key is missing.
  if (errorMessage.includes('YouTube API key is not configured')) {
    return {
      success: false,
      error: 'The YouTube API key is not configured. Please set the YOUTUBE_API_KEY environment variable.',
    };
  }

  return {
   success: false,
   error: `Failed to search for videos. ${errorMessage}`,
  };
 }
}
