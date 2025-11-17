import { v4 as uuidv4 } from "uuid";
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";

const models = initModels(sequelize);

const  {khuyenmai, taikhoan, khuyenmai_taikhoan, cuahang }  = models;

// ✅ Tạo mới khuyến mãi (Admin hoặc Cửa hàng)
export const createKhuyenMai = async (req, res) => {
  try {
    console.log("🔥 Đang gọi createKhuyenMai...");

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

    const user = decoded;
    const body = req.body;

    let MaCH = null; // Mặc định null (cho Admin)

    // 🧭 PHÂN QUYỀN THEO NGHIỆP VỤ
    if (user.role === "Cửa Hàng") {
      // ✅ CỬA HÀNG: Tìm MaCH từ database
      console.log("🔍 Cửa hàng - đang tìm MaCH từ database...");
      const cuaHang = await cuahang.findOne({
        where: { MaTK: user.MaTK },
        attributes: ["MaCH"]
      });
      
      console.log("🔍 Kết quả tìm cửa hàng:", cuaHang);
      
      if (cuaHang && cuaHang.MaCH) {
        MaCH = cuaHang.MaCH; // ✅ Gán MaCH cho cửa hàng
        console.log("✅ Tìm thấy MaCH cho cửa hàng:", MaCH);
      } else {
        console.log("❌ Không tìm thấy cửa hàng");
        return res.status(400).json({ message: "Không tìm thấy thông tin cửa hàng" });
      }
      
      // ✅ KIỂM TRA: Cửa hàng chỉ được tạo voucher PRODUCT
      if (body.LoaiKM !== "PRODUCT") {
        return res.status(403).json({ 
          message: "Cửa hàng chỉ được phép tạo khuyến mãi PRODUCT (giảm giá sản phẩm)" 
        });
      }
      
    } else if (user.role === "Admin") {
      // ✅ ADMIN: MaCH vẫn là null (voucher toàn hệ thống)
      console.log("👑 Admin - tạo voucher toàn hệ thống (MaCH = null)");
      // Admin có thể tạo tất cả loại voucher, không cần kiểm tra
      
    } else {
      // ❌ Role khác không được phép
      return res.status(403).json({ 
        message: "Chỉ Admin hoặc Cửa hàng mới được tạo khuyến mãi" 
      });
    }

    const MaKM = "KM" + uuidv4().slice(0, 8).toUpperCase();

    console.log("📦 Tạo khuyến mãi:", {
      MaKM,
      MaCH, // ✅ null (Admin) hoặc mã cửa hàng
      TenKM: body.TenKM,
      LoaiKM: body.LoaiKM,
      user_role: user.role
    });

    const km = await khuyenmai.create({
      MaKM,
      ...body,
      MaCH  // ✅ QUAN TRỌNG: null cho Admin, mã cửa hàng cho Cửa hàng
    });

    console.log("✅ Đã tạo khuyến mãi thành công:", {
      MaKM: km.MaKM,
      MaCH: km.MaCH, // ✅ Kiểm tra MaCH cuối cùng
      TenKM: km.TenKM,
      LoaiKM: km.LoaiKM
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
          NgayBatDau: { [Op.lte]: today },
          NgayKetThuc: { [Op.gte]: today }
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

    await khuyenmai.destroy({ where: { MaKM } }); 
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

// ✅ Khách hàng nhận khuyến mãi
export const nhanKhuyenMai = async (req, res) => {
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

    const user = decoded;
    const { MaKM } = req.body;

    if (!MaKM) {
      return res.status(400).json({ message: "Thiếu mã khuyến mãi" });
    }

    // 2️⃣ Kiểm tra khuyến mãi tồn tại và còn hiệu lực
    const km = await khuyenmai.findByPk(MaKM);
    if (!km) {
      return res.status(404).json({ message: "Không tìm thấy khuyến mãi" });
    }

    const today = new Date();
    if (km.NgayBatDau > today || km.NgayKetThuc < today) {
      return res.status(400).json({ message: "Khuyến mãi không còn hiệu lực" });
    }

    // 3️⃣ Kiểm tra đã nhận chưa
    const existing = await khuyenmai_taikhoan.findOne({
      where: { MaKM, MaTK: user.MaTK }
    });

    if (existing) {
      return res.status(400).json({ message: "Bạn đã nhận khuyến mãi này rồi" });
    }

    // 4️⃣ Kiểm tra giới hạn số lượng (nếu có)
    if (km.GioiHanSuDung) {
      const count = await khuyenmai_taikhoan.count({ where: { MaKM } });
      if (count >= km.GioiHanSuDung) {
        return res.status(400).json({ message: "Khuyến mãi đã hết số lượng" });
      }
    }

    // 5️⃣ Lưu khuyến mãi cho user
    const result = await khuyenmai_taikhoan.create({
      MaKM,
      MaTK: user.MaTK,
      SoLanSuDung: 0
    });

    res.json({ 
      success: true, 
      message: "Nhận khuyến mãi thành công", 
      data: result 
    });

  } catch (err) {
    console.error("🔥 Lỗi nhận khuyến mãi:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// ✅ Lấy danh sách khuyến mãi cho khách hàng (cả đã nhận và chưa nhận)
export const getKhuyenMaiForCustomer = async (req, res) => {
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
    const today = new Date();

    // Lấy tất cả khuyến mãi còn hiệu lực
    const allKhuyenMai = await khuyenmai.findAll({
      where: {
        NgayBatDau: { [Op.lte]: today },
        NgayKetThuc: { [Op.gte]: today }
      }
    });

    // Lấy danh sách khuyến mãi đã nhận
    const receivedKhuyenMai = await khuyenmai_taikhoan.findAll({
      where: { MaTK },
      include: [{ model: khuyenmai, as: "MaKM_khuyenmai" }]
    });

    const receivedMaKMs = receivedKhuyenMai.map(item => item.MaKM);

    res.json({
      allKhuyenMai,
      receivedKhuyenMai,
      receivedMaKMs
    });

  } catch (err) {
    console.error("🔥 Lỗi lấy danh sách KM cho khách hàng:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// ✅ Lấy khuyến mãi của cửa hàng
export const getKhuyenMaiByCuaHang = async (req, res) => {
  try {
    console.log("🔥 Đang gọi getKhuyenMaiByCuaHang...");

    // 1️⃣ Kiểm tra JWT
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

    // 2️⃣ Chỉ cửa hàng mới được xem
    if (decoded.role !== "Cửa Hàng") {
      return res.status(403).json({ message: "Chỉ cửa hàng mới được xem khuyến mãi của mình" });
    }

    let MaCH = decoded.MaCH;

    // ✅ TÌM MACH TỪ DATABASE NẾU KHÔNG CÓ TRONG TOKEN
    if (!MaCH) {
      console.log("🔍 Không có MaCH trong token, đang tìm từ database...");
      console.log("🔍 Tìm cửa hàng với MaTK:", decoded.MaTK);
      
      try {
        // Tìm cửa hàng dựa trên MaTK
        const cuaHang = await cuahang.findOne({
          where: { MaTK: decoded.MaTK },
          attributes: ["MaCH", "TenCH"] // Lấy cả tên cửa hàng để debug
        });
        
        console.log("🔍 Kết quả tìm cửa hàng:", cuaHang);
        
        if (cuaHang && cuaHang.MaCH) {
          MaCH = cuaHang.MaCH;
          console.log("✅ Tìm thấy MaCH từ database:", MaCH);
        } else {
          console.log("❌ Không tìm thấy cửa hàng với MaTK:", decoded.MaTK);
          
          // 🔍 DEBUG: Kiểm tra tất cả cửa hàng trong database
          const allCuaHang = await cuahang.findAll({
            attributes: ["MaCH", "MaTK", "TenCH"],
            limit: 10
          });
          console.log("🔍 10 cửa hàng đầu tiên trong DB:", allCuaHang);
          
          return res.status(400).json({ 
            message: "Không tìm thấy thông tin cửa hàng",
            debug: {
              MaTK: decoded.MaTK,
              availableStores: allCuaHang
            }
          });
        }
      } catch (dbError) {
        console.error("🔥 Lỗi khi tìm cửa hàng:", dbError);
        return res.status(500).json({ 
          message: "Lỗi database khi tìm cửa hàng",
          error: dbError.message 
        });
      }
    }

    console.log(`🔍 Lấy khuyến mãi cho cửa hàng: ${MaCH}`);

    // 3️⃣ Lấy khuyến mãi của cửa hàng
    const list = await khuyenmai.findAll({
      where: { MaCH },
      order: [['NgayTao', 'DESC']]
    });

    console.log(`✅ Tìm thấy ${list.length} khuyến mãi cho cửa hàng ${MaCH}`);
    
    // 🔍 DEBUG: Kiểm tra dữ liệu trả về
    if (list.length > 0) {
      console.log("📊 Sample khuyến mãi:", list.slice(0, 2).map(km => ({
        MaKM: km.MaKM,
        TenKM: km.TenKM,
        MaCH: km.MaCH
      })));
    } else {
      console.log("ℹ️ Cửa hàng chưa có khuyến mãi nào");
    }

    res.json(list);
    
  } catch (err) {
    console.error("🔥 Lỗi nghiêm trọng trong getKhuyenMaiByCuaHang:", err);
    res.status(500).json({ 
      message: "Lỗi server", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};