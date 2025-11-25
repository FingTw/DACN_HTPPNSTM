// src/controllers/aiController.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Import model DB
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";

// Import hàm lấy sản phẩm (nếu bạn đã tách ra helper ở bài trước)
// import { getProductsForAI } from "./sanphamController.js";

const models = initModels(sequelize);
const { sanpham } = models;

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const chatWithGemini = async (req, res) => {
  try {
    const { message, history } = req.body;

    // 1. Lấy dữ liệu sản phẩm
    let productContext = "";
    try {
      const products = await sanpham.findAll({
        limit: 30,
        attributes: ["TenSP", "GiaBan", "SLTon", "TrangThai", "DVT"],
        order: [["MaSP", "DESC"]],
      });

      if (products.length > 0) {
        productContext = products
          .map(
            (p) =>
              `- ${p.TenSP}: ${parseFloat(p.GiaBan).toLocaleString("vi-VN")}đ/${
                p.DVT || "cái"
              } (${p.SLTon > 0 ? "Còn hàng" : "Hết hàng"})`
          )
          .join("\n");
      }
    } catch (dbError) {
      console.error("⚠️ Lỗi lấy sản phẩm context:", dbError.message);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemInstruction = `
      Bạn là trợ lý ảo chuyên nghiệp của cửa hàng nông sản SAP (Sạch - An Toàn - Phủ Xanh).
      
      DƯỚI ĐÂY LÀ DANH SÁCH SẢN PHẨM HIỆN CÓ TẠI CỬA HÀNG:
      ${productContext || "Hiện chưa có thông tin sản phẩm."}

      QUY TẮC TRẢ LỜI:
      1. Dùng tiếng Việt, giọng điệu thân thiện, ngắn gọn.
      2. Chỉ tư vấn dựa trên danh sách sản phẩm ở trên.
      3. Nếu khách hỏi giá, hãy báo giá chính xác kèm đơn vị tính.
      4. Nếu sản phẩm không có trong danh sách, hãy xin lỗi và nói hiện tại cửa hàng chưa kinh doanh mặt hàng đó.
      5. Không sáng tác thêm thông tin sản phẩm không có thật.
    `;

    // Xử lý lịch sử chat
    let validHistory = [];
    if (history && Array.isArray(history)) {
      validHistory = history.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      // Đảm bảo message đầu tiên luôn là user
      while (validHistory.length > 0 && validHistory[0].role === "model") {
        validHistory.shift();
      }
    }

    // Khởi tạo chat
    const chat = model.startChat({
      history: validHistory,
      // gemini-1.5-flash hỗ trợ systemInstruction ngay trong config
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstruction }],
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      reply: text,
    });
  } catch (error) {
    console.error("❌ Gemini Error:", error);
    res.status(500).json({
      success: false,
      message: "Hệ thống AI đang bận hoặc gặp sự cố phiên bản.",
      error: error.message,
    });
  }
};
