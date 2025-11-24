import jwt from "jsonwebtoken";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";

const models = initModels(sequelize);
const { giohang, ctgh, sanpham, hinhanh, cuahang } = models;

// 🛒 Thêm sản phẩm vào giỏ
// 🛒 Thêm sản phẩm vào giỏ - CÓ VALIDATION CHẶN CỬA HÀNG
export const addToCart = async (req, res) => {
  try {
    // 1️⃣ Kiểm tra JWT
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    const MaTK = decoded.MaTK;

    // 2️⃣ Lấy body và validate quantity
    const { MaSP, quantity = 1 } = req.body;
    if (!MaSP) {
      return res.status(400).json({ message: "Thiếu mã sản phẩm (MaSP)" });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      return res
        .status(400)
        .json({ message: "Số lượng không hợp lệ (phải là số nguyên >= 1)" });
    }

    // 3️⃣ Lấy thông tin sản phẩm KÈM THÔNG TIN CỬA HÀNG
    const sp = await sanpham.findOne({ 
      where: { MaSP },
      include: [
        {
          model: cuahang,
          as: "cuahang",
          attributes: ["MaCH", "MaTK"]
        }
      ]
    });
    
    if (!sp) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // 🔥 VALIDATION: KIỂM TRA CÓ PHẢI SẢN PHẨM CỦA CHÍNH MÌNH KHÔNG
    if (sp.cuahang && sp.cuahang.MaTK === MaTK) {
      return res.status(400).json({ 
        success: false,
        message: "Bạn không thể thêm sản phẩm của chính mình vào giỏ hàng" 
      });
    }

    if (!sp.SLTon || sp.SLTon <= 0) {
      return res.status(400).json({ message: "Sản phẩm đã hết hàng" });
    }

    if (qty > sp.SLTon) {
      return res
        .status(400)
        .json({ message: `Số lượng vượt quá tồn kho (${sp.SLTon})` });
    }

    // 4️⃣ Tìm giỏ hàng
    let cart = await giohang.findOne({
      where: { MaTK },
      include: [
        {
          model: ctgh,
          as: "ctghs",
          include: [{ model: sanpham, as: "MaSP_sanpham" }],
        },
      ],
    });

    // Nếu chưa có giỏ, tạo mới
    if (!cart) {
      const MaGH = uuidv4().replace(/-/g, "").substring(0, 10);
      cart = await giohang.create({ MaGH, MaTK });
    }

    // 5️⃣ Kiểm tra sản phẩm đã có trong giỏ chưa
    let item = await ctgh.findOne({ where: { MaGH: cart.MaGH, MaSP } });

    if (item) {
      const newSL = item.SL + qty;
      if (newSL > sp.SLTon) {
        return res.status(400).json({
          message: `Số lượng trong giỏ vượt quá tồn kho (${sp.SLTon})`,
        });
      }
      item.SL = newSL;
    } else {
      item = await ctgh.create({
        MaGH: cart.MaGH,
        MaSP,
        SL: qty,
        TongTien: 0,
      });
    }

    // 6️⃣ Cập nhật tổng tiền
    item.TongTien = sp.GiaBan * item.SL;
    await item.save();

    return res.json({ success: true, message: "Đã thêm vào giỏ hàng!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// 🔁 Cập nhật số lượng
export const updateQuantity = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    const MaTK = decoded.MaTK;
    const { MaSP, quantity } = req.body;

    const cart = await giohang.findOne({
      where: { MaTK: MaTK },
      include: [{ model: ctgh, as: "ctghs" }],
    });

    if (!cart)
      return res.json({ success: false, message: "Không tìm thấy giỏ hàng." });

    const item = cart.ctghs.find((c) => c.MaSP === MaSP);
    if (!item)
      return res.json({
        success: false,
        message: "Sản phẩm không có trong giỏ hàng.",
      });

    item.SL = quantity < 1 ? 1 : quantity;

    const sp = await sanpham.findOne({ where: { MaSP: MaSP } });
    if (sp) {
      item.TongTien = sp.GiaBan * item.SL;
      await item.save();
    }

    return res.json({
      success: true,
      newQuantity: item.SL,
      newTotal: item.TongTien,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// ❌ Xóa sản phẩm khỏi giỏ
export const removeFromCart = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    const MaTK = decoded.MaTK;
    const { MaSP } = req.body;

    const cart = await giohang.findOne({ where: { MaTK: MaTK } });
    if (!cart)
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    const item = await ctgh.findOne({ where: { MaGH: cart.MaGH, MaSP: MaSP } });
    if (item) await item.destroy();

    return res.json({ success: true, message: "Đã xóa khỏi giỏ hàng" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// 🔢 Lấy tổng số lượng sản phẩm
export const getCartCount = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ count: 0, message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ count: 0, message: "Token không hợp lệ" });
    }

    const MaTK = decoded.MaTK;

    const cart = await giohang.findOne({
      where: { MaTK: MaTK },
      include: [{ model: ctgh, as: "ctghs" }],
    });

    const count = cart?.ctghs?.reduce((acc, item) => acc + item.SL, 0) || 0;
    return res.json({ count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ count: 0, message: "Lỗi server" });
  }
};

// 📦 Lấy toàn bộ giỏ hàng
export const getCart = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    const MaTK = decoded.MaTK;

    // Tìm giỏ hàng với đầy đủ thông tin sản phẩm
    const cart = await giohang.findOne({
      where: { MaTK },
      include: [
        {
          model: ctgh,
          as: "ctghs",
          include: [
            {
              model: sanpham,
              as: "MaSP_sanpham",
              include: [
                {
                  model: hinhanh,
                  as: "hinhanhs", // Alias phải khớp với init-models (thường là 'hinhanhs')
                  attributes: ["URL"],
                  through: { attributes: [] }, // Nếu là quan hệ N-N qua bảng trung gian
                },
                {
                  model: cuahang,
                  as: "cuahang",
                  attributes: ["TenCH", "MaCH"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!cart) {
      return res.json({
        success: true,
        cart: null,
        items: [],
        total: 0,
      });
    }

    // Format response
    const items = cart.ctghs.map((item) => {
      // Lấy data sản phẩm thô từ sequelize
      const product = item.MaSP_sanpham;

      return {
        MaGH: item.MaGH,
        MaSP: item.MaSP,
        SL: item.SL,
        TongTien: item.TongTien,

        // 🟢 QUAN TRỌNG: Phải đặt tên key là "MaSP_sanpham" để khớp với Frontend CartItem.tsx
        MaSP_sanpham: {
          MaSP: product.MaSP,
          TenSP: product.TenSP,
          GiaBan: product.GiaBan,
          SLTon: product.SLTon,

          // 🟢 QUAN TRỌNG: Trả về nguyên mảng hinhanhs để Frontend tự xử lý
          // (Vì CartItem.tsx đang dùng hinhanhs[0].URL)
          hinhanhs: product.hinhanhs || [],

          MoTa: product.MoTa,
        },
      };
    });

    const total = items.reduce((sum, item) => sum + item.TongTien, 0);

    return res.json({
      success: true,
      cart: {
        MaGH: cart.MaGH,
        MaTK: cart.MaTK,
      },
      items,
      total,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
