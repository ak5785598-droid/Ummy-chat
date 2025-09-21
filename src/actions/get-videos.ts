"use server";

import { searchYoutube, type VideoSearchResult } from "@/ai/flows/youtube-video-search";
export type { VideoSearchResult };

export async function searchVideosAction(query: string) {
  try {
    const result = await searchYoutube(query);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    if (errorMessage.includes('API key')) {
        return { success: false, error: "The YouTube search feature is not configured. Please add a Google API key." };
    }
    return {
      success: false,
      error: "Failed to search for videos. Please try again later.",
    };
  }
}
