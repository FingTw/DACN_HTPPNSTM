import axios from "axios";

const AI_API_URL = "http://localhost:5000";

export const aiService = {
  predictImage: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${AI_API_URL}/predict`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("AI Service Error:", error);
      throw error;
    }
  },
  getClasses: async () => {
    try {
      const response = await axios.get(`${AI_API_URL}/classes`);
      return response.data;
    } catch (error) {
      console.error("AI Service Error:", error);
      throw error;
    }
  },
};
