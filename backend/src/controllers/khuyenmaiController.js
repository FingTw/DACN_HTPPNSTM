import { v4 as uuidv4 } from "uuid";
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import jwt from "jsonwebtoken";

const models = initModels(sequelize);

const  {khuyenmai, taikhoan, khuyenmai_taikhoan}  = models;

// ✅ Tạo mới khuyến mãi (Admin hoặc Cửa hàng)
export const createKhuyenMai = async (req, res) => {
    // console.log("🔥 Đã vào createKhuyenMai");
  try {
    // 1️⃣ Kiểm tra JWT trực tiếp
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("🧠 Token decoded:", decoded);
    } catch (err) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    const user = decoded; // user chứa MaTK, role, MaCH,...
    // const MaTK = decoded.MaTK;

    const {
      TenKM, MoTa, LoaiKM, GiaTriGiam, HinhThucGiam,
      DieuKien, SoTienGiamToiDa, NgayBatDau, NgayKetThuc,
      GioiHanSuDung
    } = req.body;

    let MaCH = null;

    // 🧭 Phân quyền trực tiếp từ role
    if (user.role === "Cửa Hàng") {
      MaCH = user.MaCH; // Lấy từ token của cửa hàng
      if (LoaiKM !== "PRODUCT") {
        return res.status(403).json({ message: "Cửa hàng chỉ được phép tạo khuyến mãi PRODUCT" });
      }
    } else if (user.role !== "Admin") {
      return res.status(403).json({ message: "Chỉ admin hoặc cửa hàng mới được tạo khuyến mãi" });
    }

    const MaKM = "KM" + uuidv4().slice(0, 8).toUpperCase();

    const km = await khuyenmai.create({
      MaKM,
      TenKM,
      MoTa,
      LoaiKM,
      GiaTriGiam,
      HinhThucGiam,
      DieuKien,
      SoTienGiamToiDa,
      NgayBatDau,
      NgayKetThuc,
      GioiHanSuDung,
      MaCH
    });

    res.status(201).json({ success: true, data: km });
  } catch (err) {
    console.error("🔥 Lỗi tạo khuyến mãi:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};


// 📌 Lấy danh sách khuyến mãi (Admin có thể xem tất cả, cửa hàng xem của mình)
export const getAllKhuyenMai = async (req, res) => {
  try {
    // 1️⃣ Kiểm tra JWT trực tiếp
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

    const user = decoded;

    let list;
    if (user.role === "Admin") {
      list = await khuyenmai.findAll();
    } else if (user.role === "Cửa Hàng") {
      list = await khuyenmai.findAll({ where: { MaCH: user.MaCH } });
    } else {
      // user thường: chỉ thấy khuyến mãi còn hiệu lực
      const today = new Date();
      list = await khuyenmai.findAll({
        where: {
          NgayBatDau: { lte: today },
          NgayKetThuc: { gte: today }
        }
      });
    }

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// ✏️ Cập nhật khuyến mãi (chỉ Admin hoặc chính cửa hàng đó)
export const updateKhuyenMai = async (req, res) => {
  try {
    // 1️⃣ Kiểm tra JWT trực tiếp
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

    const user = decoded;

    const { MaKM } = req.params;
    const body = req.body;

    const km = await khuyenmai.findByPk(MaKM);
    if (!km) return res.status(404).json({ message: "Không tìm thấy khuyến mãi" });

    if (user.role !== "Admin" && km.MaCH !== user.MaCH) {
      return res.status(403).json({ message: "Không có quyền sửa khuyến mãi này" });
    }

    await khuyenmai.update(body, { where: { MaKM } });
    res.json({ success: true, message: "Đã cập nhật khuyến mãi" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// 🗑️ Xoá khuyến mãi (chỉ Admin hoặc chính cửa hàng đó)
export const deleteKhuyenMai = async (req, res) => {
  try {
    // 1️⃣ Kiểm tra JWT trực tiếp
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token decoded:", decoded);
    } catch (err) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    const user = decoded;

    const { MaKM } = req.params;
    const km = await khuyenmai.findByPk(MaKM);
    if (!km) return res.status(404).json({ message: "Không tìm thấy khuyến mãi" });

    if (user.role !== "Admin" && km.MaCH !== user.MaCH) {
      return res.status(403).json({ message: "Không có quyền xoá khuyến mãi này" });
    }

    await KhuyenMai.destroy({ where: { MaKM } });
    res.json({ success: true, message: "Đã xoá khuyến mãi" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// ✅ Admin gán mã khuyến mãi cho người dùng cụ thể
export const assignKhuyenMaiToUser = async (req, res) => {
  try {
    // 1️⃣ Kiểm tra token
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

    // 2️⃣ Chỉ Admin mới được gán
    if (decoded.role !== "Admin") {
      return res.status(403).json({ message: "Chỉ Admin mới được phép gán mã khuyến mãi" });
    }

    const { MaKM, MaTK } = req.body;
    if (!MaKM || !MaTK) {
      return res.status(400).json({ message: "Thiếu MaKM hoặc MaTK" });
    }

    // 3️⃣ Kiểm tra tồn tại mã KM & TK
    const km = await khuyenmai.findByPk(MaKM);
    if (!km) return res.status(404).json({ message: "Không tìm thấy mã khuyến mãi" });

    const tk = await taikhoan.findByPk(MaTK);
    if (!tk) return res.status(404).json({ message: "Không tìm thấy tài khoản" });

    // 4️⃣ Kiểm tra đã gán chưa
    const existing = await khuyenmai_taikhoan.findOne({ where: { MaKM, MaTK } });
    if (existing) {
      return res.status(400).json({ message: "Mã này đã được gán cho tài khoản này rồi" });
    }

    // 5️⃣ Gán mã
    const result = await khuyenmai_taikhoan.create({
      MaKM,
      MaTK,
      SoLanSuDung: 0
    });

    res.json({ success: true, message: "Đã gán mã khuyến mãi cho tài khoản", data: result });
  } catch (err) {
    console.error("🔥 Lỗi gán mã khuyến mãi:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
export const getUserKhuyenMai = async (req, res) => {
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

    const list = await khuyenmai_taikhoan.findAll({
      where: { MaTK },
      include: [
        { model: khuyenmai, as: "MaKM_khuyenmai" } // dùng alias nếu có định nghĩa trong init-models
      ]
    });

    res.json(list);
  } catch (err) {
    console.error("🔥 Lỗi lấy danh sách KM user:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
