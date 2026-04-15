"use server";

import {
 getChatRoomRecommendations,
 type ChatRoomRecommendationsInput,
} from "@/ai/flows/ai-powered-chat-room-recommendations";

export async function getRecommendationsAction(
 input: ChatRoomRecommendationsInput
): Promise<{ success: boolean, data?: string[], error?: string }> {
 try {
  const result = await getChatRoomRecommendations(input);
  return { success: true, data: result.recommendedChatRooms };
 } catch (error) {
  console.error(error);
  return {
   success: false,
   error: "Failed to get recommendations. Please try again later.",
  };
 }
}
