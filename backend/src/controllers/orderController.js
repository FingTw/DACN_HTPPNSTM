import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";

const models = initModels(sequelize);

const { donhang, chitiet_donhang, sanpham, ptvc, pttt, giohang, ctgh, taikhoan, lichsu_trangthai, khuyenmai, khuyenmai_taikhoan, thanhtoan } = models;

export const checkout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) 
      return res.status(401).json({ message: "Không có token" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const MaTK = decoded.MaTK;

    // Lấy giỏ hàng từ CTGH join GioHang
    const cart = await ctgh.findAll({
      include: [
        { 
          model: sanpham, 
          as: "MaSP_sanpham" 
        },
        {
          model: giohang,      // join tới bảng giohang
          as: "MaGH_giohang", // alias phải đúng association
          where: { MaTK: MaTK } // lọc theo tài khoản
        }
      ]
    });

    if (!cart || cart.length === 0) 
      return res.status(400).json({ message: "Giỏ hàng trống" });

    return res.json(cart);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};


export const checkoutItem = async (req, res) => {
  try {
    const { MaSP } = req.body;
    if (!MaSP) return res.status(400).json({ message: "Thiếu MaSP" });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ message: "Không có token" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const MaTK = decoded.MaTK;

    const item = await ctgh.findOne({
    where: { MaSP: MaSP }, // chỉ filter theo MaSP trong ctgh
    include: [
        { model: sanpham, as: "MaSP_sanpham" },
        { 
        model: giohang, 
        as: "MaGH_giohang", 
        where: { MaTK: MaTK } 
        }
    ]
    });

    if (!item) return res.status(404).json({ message: "Sản phẩm không có trong giỏ" });

    return res.json(item);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const processCheckout = async (req, res) => {
  try {
    // === 1. Xác thực JWT ===
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Token không hợp lệ hoặc hết hạn" });
    }
    const MaTK = decoded.MaTK;

    // === 2. Lấy thông tin từ body ===
    const { DCNhanHang, MaPTVC, MaPTTT, items } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ message: "Chưa chọn sản phẩm để thanh toán" });
    }

    // === 3. Lấy giỏ hàng của user ===
    const cart = await giohang.findOne({
      where: { MaTK },
      include: [
        { 
          model: ctgh, 
          as: "ctghs",
          include: [{ model: sanpham, as: "MaSP_sanpham" }]
        }
      ]
    });

    if (!cart || !cart.ctghs || cart.ctghs.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    /// === 4. Lọc & cập nhật số lượng theo lựa chọn của user ===
    const selectedItems = cart.ctghs
      .filter(ct => items.some(i => i.MaSP === ct.MaSP))
      .map(ct => {
        const selected = items.find(i => i.MaSP === ct.MaSP);
        return {
          ...ct.dataValues,  // giữ nguyên các trường khác
          SL: selected.SL    // ghi đè số lượng bằng số user chọn
        };
      });


    // === 5. Kiểm tra tồn kho ===
    for (let ct of selectedItems) {
      const sp = await sanpham.findByPk(ct.MaSP);
      if (!sp) {
        return res.status(400).json({ message: `Sản phẩm ${ct.MaSP} không tồn tại` });
      }
      if (sp.SLTon < ct.SL) {
        return res.status(400).json({ message: `Sản phẩm ${sp.TenSP} không đủ tồn kho` });
      }
    }

    // === 6. Trừ tồn kho ===
    for (let ct of selectedItems) {
      const sp = await sanpham.findByPk(ct.MaSP);
      sp.SLTon -= ct.SL;
      await sp.save();
    }

    // === 7. Tạo đơn hàng ===
    const MaDH = "DH" + uuidv4().replace(/-/g, "").substring(0, 8);
    const tongTien = selectedItems.reduce(
      (sum, ct) => sum + ct.SL * parseFloat(ct.MaSP_sanpham.GiaBan),
      0
    );

    // === 7.1. Áp dụng mã khuyến mãi nếu có ===
    let tongTienSauKM = tongTien;
    let giamGia = 0;

    if (req.body.MaKM) {
      const MaKM = req.body.MaKM;

    // === 7.2. Kiểm tra user có được gán mã này không
    const userKM = await khuyenmai_taikhoan.findOne({
      where: { MaKM, MaTK }
    });

    if (!userKM) {
      return res.status(400).json({ message: "Mã khuyến mãi không hợp lệ hoặc không được gán cho bạn" });
    }

    // === 7.3. Lấy thông tin khuyến mãi
    const km = await khuyenmai.findOne({ where: { MaKM } });
    if (!km) {
      return res.status(404).json({ message: "Không tìm thấy mã khuyến mãi" });
   }

    // === 7.4. Kiểm tra thời hạn
    const now = new Date();
    if (now < km.NgayBatDau || now > km.NgayKetThuc) {
      return res.status(400).json({ message: "Mã khuyến mãi đã hết hạn hoặc chưa bắt đầu" });
    }

    // === 7.5. Kiểm tra giới hạn sử dụng
    if (km.GioiHanSuDung !== 0 && userKM.SoLanSuDung >= km.GioiHanSuDung) {
      return res.status(400).json({ message: "Bạn đã sử dụng hết số lần cho mã này" });
    }

    // === 7.6. Tính giảm giá
    if (km.HinhThucGiam === "FIXED") {
      giamGia = Math.min(km.GiaTriGiam, tongTien);
    } else if (km.HinhThucGiam === "PERCENT") {
      giamGia = tongTien * (km.GiaTriGiam / 100);
      if (km.SoTienGiamToiDa && giamGia > km.SoTienGiamToiDa) {
        giamGia = km.SoTienGiamToiDa;
      }
    }

    tongTienSauKM = tongTien - giamGia;

    // === 7.7. Cập nhật số lần đã sử dụng của mã
    await khuyenmai_taikhoan.update(
     { SoLanSuDung: userKM.SoLanSuDung + 1 },
      { where: { MaKM, MaTK } }
    );
    }
    const newDonHang = await donhang.create({
      MaDH,
      MaTK,
      DCNhanHang,
      MaPTVC,
      MaPTTT,
      TongTien: tongTienSauKM,
      GiamGia: giamGia,       // 🆕 nếu bảng donhang có cột này
      // MaKM: req.body.MaKM || null, // 🆕 lưu lại mã KM nếu có
      TrangThai: "Chờ xác nhận",
      NgayTao: new Date()
    });

    // === 7.8. Tạo bản ghi thanh toán cùng lúc với đơn
    const ptttRecord = await pttt.findByPk(MaPTTT);
    if (!ptttRecord) {
      return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ" });
    }

    const isCOD = ptttRecord.TenPTTT.toLowerCase().includes("cod");
    const paymentStatus = isCOD ? "Chờ khách thanh toán" : "Đã thanh toán";

    const MaTT = "TT" + uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();

    const dataThanhToan = {
      MaTT,
      MaDH: newDonHang.MaDH,
      Sotien: tongTienSauKM,
      TrangThai: paymentStatus,
      MaPTTT
    };

    // ✅ Nếu thanh toán online thì ghi thời điểm thanh toán ngay
    if (paymentStatus === "Đã thanh toán") {
      dataThanhToan.NgayTao = new Date();
      dataThanhToan.Thoigian = new Date().toLocaleTimeString("vi-VN", {
        hour12: false,
        timeZone: "Asia/Ho_Chi_Minh"});
    }else {
      dataThanhToan.NgayTao = null;
      dataThanhToan.Thoigian = null;
    }

    await thanhtoan.create(dataThanhToan);


    // === 8. Tạo chi tiết đơn hàng ===
    for (let ct of selectedItems) {
      await chitiet_donhang.create({
        MaDH: newDonHang.MaDH,
        MaSP: ct.MaSP,
        TenSP: ct.MaSP_sanpham.TenSP,
        SoLuong: ct.SL,
        GiaBan: ct.MaSP_sanpham.GiaBan
      });
    }

    // === 9. Xóa các sản phẩm đã checkout khỏi giỏ ===
    const MaSPs = selectedItems.map(ct => ct.MaSP);
    await ctgh.destroy({ where: { MaGH: cart.MaGH, MaSP: MaSPs } });

    // === 10. Nếu giỏ hàng trống => xóa giỏ ===
    const remaining = await ctgh.count({ where: { MaGH: cart.MaGH } });
    if (remaining === 0) {
      await giohang.destroy({ where: { MaGH: cart.MaGH } });
    }

    // === 11. Kết quả ===
    return res.json({ success: true, MaDH });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

export const orderSuccess = async (req, res) => {
  try {
    const { MaDH } = req.params;

    const order = await donhang.findOne({
      where: { MaDH },
      include: [{ model: chitiet_donhang, as: "chitiet_donhangs" }] // dùng alias đúng
    });

    if (!order) return res.status(404).json({ message: "Đơn hàng không tồn tại" });

    return res.json(order);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { MaDH } = req.params;
  const { TrangThai } = req.body;
  console.log("📦 Body nhận được:", req.body);
  console.log("📌 TrangThai:", TrangThai);
  try {
    // 🛡️ 1. Xác thực token và lấy MaTK từ JWT
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
    const userMaTK = decoded.MaTK;

    // 🔎 2. Lấy đơn hàng
    const order = await donhang.findOne({ where: { MaDH } });
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // ✅ Gợi ý 1: Kiểm tra quyền người dùng (chỉ người đặt đơn mới được hủy)
    if (order.MaTK !== userMaTK) {
      return res.status(403).json({ message: "Bạn không có quyền thay đổi đơn hàng này" });
    }

    // ✅ Gợi ý 2: Chỉ cho phép hủy khi đơn đang ở trạng thái “Chờ xác nhận” hoặc “Đang xử lý”
    const choPhepHuy = ["Chờ xác nhận", "Đang xử lý"];
    if (TrangThai === "Hủy đơn hàng" && !choPhepHuy.includes(order.TrangThai)) {
      return res.status(400).json({ message: "Không thể hủy đơn ở trạng thái hiện tại" });
    }

    // 👉 Nếu là hủy đơn, thực hiện trả hàng về giỏ + hoàn lại tồn kho
    if (TrangThai === "Hủy đơn hàng") {
      const chiTietList = await chitiet_donhang.findAll({ where: { MaDH } });

      if (!chiTietList || chiTietList.length === 0) {
        return res.status(400).json({ message: "Đơn hàng không có sản phẩm để hoàn" });
      }

      // Trả lại tồn kho
      for (const ct of chiTietList) {
        const sp = await sanpham.findOne({ where: { MaSP: ct.MaSP } });
        if (sp) {
          sp.SLTon += ct.SoLuong;
          await sp.save();
        }
      }
      // 🔄 Hoàn lại số lần sử dụng mã KM nếu có
      if (order.MaKM) {
        const userKM = await khuyenmai_taikhoan.findOne({ where: { MaKM: order.MaKM, MaTK: order.MaTK } });
        if (userKM && userKM.SoLanSuDung > 0) {
          await khuyenmai_taikhoan.update(
            { SoLanSuDung: userKM.SoLanSuDung - 1 },
            { where: { MaKM: order.MaKM, MaTK: order.MaTK } }
          );
        }
      }

      // Trả lại giỏ hàng
      let cart = await giohang.findOne({ where: { MaTK: order.MaTK } });
      if (!cart) {
        cart = await giohang.create({
          MaGH: "GH" + Math.random().toString(36).substring(2, 10).toUpperCase(),
          MaTK: order.MaTK
        });
      }

      for (const ct of chiTietList) {
        let item = await ctgh.findOne({ where: { MaGH: cart.MaGH, MaSP: ct.MaSP } });
        if (item) {
          item.SL += ct.SoLuong;
          item.TongTien = item.SL * ct.GiaBan;
          await item.save();
        } else {
          await ctgh.create({
            MaGH: cart.MaGH,
            MaSP: ct.MaSP,
            SL: ct.SoLuong,
            TongTien: ct.GiaBan * ct.SoLuong
          });
        }
      }
    }

    // 📝 Gợi ý 3: Ghi log lịch sử trạng thái

    if (lichsu_trangthai) {
    await lichsu_trangthai.create({
    MaLS: "LS" + Math.random().toString(36).substring(2, 10).toUpperCase(),
    MaDH: order.MaDH,
    TrangThaiCu: order.TrangThai,
    TrangThaiMoi: TrangThai,
    NgayCapNhat: new Date(),
    NguoiCapNhat: userMaTK
  });
}

// ✅ Cập nhật trạng thái đơn hàng trực tiếp bằng .update()
if (order.TrangThai !== TrangThai) {
  await donhang.update(
    { TrangThai },
    { where: { MaDH } }
  );
}else {
  console.log(`⚠️ Trạng thái không đổi cho đơn ${MaDH} → Không update`);
}


    return res.json({ success: true, message: `Đã cập nhật trạng thái đơn hàng: ${TrangThai}` });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Thêm vào controllers/orderController.js
export const getShippingMethods = async (req, res) => {
  try {
    const methods = await ptvc.findAll();
    res.json(methods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getPaymentMethods = async (req, res) => {
  try {
    const methods = await pttt.findAll();
    res.json(methods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};