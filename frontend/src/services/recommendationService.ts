import axios from "axios";

// URL của Server Python AI
const AI_API_URL = "http://localhost:5000";

export interface RecommendationResult {
  product: string; // Tên từ AI (vd: 'apple')
  score: number;
}

export const getRecommendations = async (cartItems: string[]) => {
  try {
    const response = await axios.post(
      `${AI_API_URL}/recommend`,
      { cart: cartItems },
      { timeout: 3000 }
    );

    if (response.data.success) {
      return response.data.recommendations as RecommendationResult[];
    }
    return [];
  } catch (error) {
    console.warn("⚠️ AI Service không phản hồi hoặc lỗi:", error);
    return [];
  }
};
