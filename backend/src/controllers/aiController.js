// src/controllers/aiController.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const models = initModels(sequelize);
const { sanpham, hinhanh } = models;

export const chatWithAI = async (req, res) => {
  try {
    const { prompt, history } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    // 1️⃣ Get product list from DB
    const products = await sanpham.findAll({
      limit: 30,
      attributes: ["MaSP", "TenSP", "GiaBan", "MoTa"],
      include: [
        {
          model: hinhanh,
          as: "hinhanhs",
          attributes: ["URL"],
          through: { attributes: [] },
        },
      ],
      order: [["MaSP", "DESC"]],
    });

    // Format product data into string for prompt context
    const productContext = products
      .map((p) => {
        // Only take the first image
        const img =
          p.hinhanhs && p.hinhanhs.length > 0 ? p.hinhanhs[0].URL : "";

        return `ID: ${p.MaSP}, Name: ${p.TenSP}, Price: ${p.GiaBan}, Desc: ${p.MoTa}, ImageURL: ${img}`;
      })
      .join("\n---\n");

    // 2️⃣ Configure Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // Or your preferred model
      generationConfig: { responseMimeType: "application/json" },
    });

    // 3️⃣ Construct System Prompt
    const systemPrompt = `
      Bạn là một trợ lý bán hàng nông sản ảo nhiệt tình và am hiểu.
      Nhiệm vụ của bạn là tư vấn cho khách hàng dựa trên danh sách sản phẩm có sẵn dưới đây.

      DANH SÁCH SẢN PHẨM CỦA CỬA HÀNG:
      ${productContext}

      QUY TẮC PHẢN HỒI QUAN TRỌNG (BẮT BUỘC TUÂN THỦ):
      Bạn phải LUÔN LUÔN trả lời bằng định dạng JSON hợp lệ. Không bao giờ trả lời bằng văn bản thuần túy.

      Có 2 loại phản hồi JSON:

      LOẠI 1: Phản hồi trò chuyện thông thường (không gợi ý sản phẩm cụ thể):
      {
        "type": "text",
        "content": "Câu trả lời của bạn ở đây (ví dụ: Chào bạn, tôi có thể giúp gì?)"
      }

      LOẠI 2: Phản hồi khi bạn muốn gợi ý MỘT sản phẩm cụ thể từ danh sách trên:
      {
        "type": "product_suggestion",
        "message": "Câu dẫn dắt ngắn gọn (ví dụ: Tôi nghĩ sản phẩm này rất hợp với nhu cầu của bạn:)",
        "product": {
          "MaSP": "ID sản phẩm từ danh sách",
          "TenSP": "Tên sản phẩm chính xác từ danh sách",
          "GiaBan": 12345 (Giá bán dạng số từ danh sách),
          "HinhAnh": "URL ảnh từ danh sách"
        }
      }

      Nếu khách hàng hỏi về một loại sản phẩm mà cửa hàng có, hãy ưu tiên dùng LOẠI 2 để gợi ý sản phẩm phù hợp nhất.
      Nếu khách hỏi vu vơ hoặc không liên quan đến sản phẩm, dùng LOẠI 1.
    `;

    // 4️⃣ Start chat
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        {
          role: "model",
          parts: [
            {
              text: '{"type": "text", "content": "Tôi đã hiểu. Tôi sẵn sàng tư vấn."}',
            },
          ],
        },
        ...(history?.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        })) || []),
      ],
    });

    const result = await chat.sendMessage(prompt);
    const responseText = result.response.text();

    // Parse JSON from Gemini response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (e) {
      console.error("AI response structure error:", responseText);
      parsedResponse = {
        type: "text",
        content: responseText || "Xin lỗi, tôi đang gặp chút sự cố.",
      };
    }

    res.json(parsedResponse);
  } catch (error) {
    console.error("Lỗi Gemini:", error);
    res.status(500).json({
      type: "text",
      content: "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.",
      error: error.message,
    });
  }
};
