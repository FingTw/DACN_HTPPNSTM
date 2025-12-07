import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { initModels } from "../models/init-models.js";
import { Op } from "sequelize";
import sequelize from "../config/db.js";
import { DistanceCalculator } from "../services/distanceCalculator.js";

const models = initModels(sequelize);

const {
  donhang,
  chitiet_donhang,
  sanpham,
  ptvc,
  pttt,
  giohang,
  ctgh,
  taikhoan,
  lichsu_trangthai,
  khuyenmai,
  khuyenmai_taikhoan,
  thanhtoan,
  hdbanhang,
  cuahang,
  giaodich_vi,
  hinhanh,
} = models;

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
          as: "MaSP_sanpham",
        },
        {
          model: giohang, // join tới bảng giohang
          as: "MaGH_giohang", // alias phải đúng association
          where: { MaTK: MaTK }, // lọc theo tài khoản
        },
      ],
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
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ message: "Không có token" });

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
          where: { MaTK: MaTK },
        },
      ],
    });

    if (!item)
      return res.status(404).json({ message: "Sản phẩm không có trong giỏ" });

    return res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// controllers/orderController.js - THÊM LOGGING CHI TIẾT
export const processCheckout = async (req, res) => {
  let transaction;
  try {
    console.log("=== BẮT ĐẦU PROCESS CHECKOUT ===");

    // === 1. Xác thực JWT ===
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ Không có token");
      return res.status(401).json({ message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token decoded:", decoded.MaTK);
    } catch (err) {
      console.log("❌ Token không hợp lệ:", err.message);
      return res
        .status(401)
        .json({ message: "Token không hợp lệ hoặc hết hạn" });
    }
    const MaTK = decoded.MaTK;

    // === 2. Lấy thông tin từ body ===
    const {
      DCNhanHang,
      MaPTVC,
      MaPTTT,
      items,
      appliedVouchers,
      PhiVanChuyen, // 🆕 NHẬN PHÍ VẬN CHUYỂN TỪ FRONTEND
    } = req.body;

    console.log("📦 Request body:", {
      DCNhanHang,
      MaPTVC,
      MaPTTT,
      itemsCount: items?.length,
      appliedVouchers,
      PhiVanChuyen, // 🆕 LOG PHÍ VẬN CHUYỂN
    });

    if (!items || !items.length) {
      console.log("❌ Không có items");
      return res
        .status(400)
        .json({ message: "Chưa chọn sản phẩm để thanh toán" });
    }

    if (!DCNhanHang?.trim()) {
      console.log("❌ Thiếu địa chỉ nhận hàng");
      return res
        .status(400)
        .json({ message: "Địa chỉ nhận hàng không được để trống" });
    }

    // 🆕 VALIDATE PHÍ VẬN CHUYỂN
    if (
      PhiVanChuyen === undefined ||
      PhiVanChuyen === null ||
      PhiVanChuyen < 0
    ) {
      console.log("❌ Phí vận chuyển không hợp lệ:", PhiVanChuyen);
      return res.status(400).json({ message: "Phí vận chuyển không hợp lệ" });
    }

    // === 3. Lấy giỏ hàng của user ===
    console.log("🔍 Lấy giỏ hàng cho user:", MaTK);
    const cart = await giohang.findOne({
      where: { MaTK },
      include: [
        {
          model: ctgh,
          as: "ctghs",
          include: [{ model: sanpham, as: "MaSP_sanpham" }],
        },
      ],
    });

    if (!cart || !cart.ctghs || cart.ctghs.length === 0) {
      console.log("❌ Giỏ hàng trống");
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    console.log(
      "✅ Tìm thấy giỏ hàng:",
      cart.MaGH,
      "với",
      cart.ctghs.length,
      "sản phẩm"
    );

    // === 4. Lọc & cập nhật số lượng theo lựa chọn của user ===
    const selectedItems = cart.ctghs
      .filter((ct) => items.some((i) => i.MaSP === ct.MaSP))
      .map((ct) => {
        const selected = items.find((i) => i.MaSP === ct.MaSP);
        return {
          ...ct.dataValues,
          SL: selected.SL,
        };
      });

    console.log("🛒 Selected items:", selectedItems.length);

    // === 5. Kiểm tra tồn kho ===
    console.log("🔍 Kiểm tra tồn kho...");
    for (let ct of selectedItems) {
      const sp = await sanpham.findByPk(ct.MaSP);
      if (!sp) {
        console.log("❌ Sản phẩm không tồn tại:", ct.MaSP);
        return res
          .status(400)
          .json({ message: `Sản phẩm ${ct.MaSP} không tồn tại` });
      }
      if (sp.SLTon < ct.SL) {
        console.log(
          "❌ Không đủ tồn kho:",
          ct.MaSP,
          "cần",
          ct.SL,
          "có",
          sp.SLTon
        );
        return res
          .status(400)
          .json({ message: `Sản phẩm ${sp.TenSP} không đủ tồn kho` });
      }
    }

    // Bắt đầu transaction
    transaction = await sequelize.transaction();
    console.log("✅ Transaction started");

    // === 6. Trừ tồn kho ===
    console.log("📉 Trừ tồn kho...");
    for (let ct of selectedItems) {
      const sp = await sanpham.findByPk(ct.MaSP);
      sp.SLTon -= ct.SL;
      await sp.save({ transaction });
      console.log(
        `✅ Đã trừ ${ct.SL} sản phẩm ${ct.MaSP}, tồn kho còn: ${sp.SLTon}`
      );
    }

    // === 7. Tạo đơn hàng ===
    const MaDH = "DH" + uuidv4().replace(/-/g, "").substring(0, 8);

    // Tính tổng tiền sản phẩm
    const tongTienSanPham = selectedItems.reduce(
      (sum, ct) => sum + ct.SL * parseFloat(ct.MaSP_sanpham.GiaBan),
      0
    );

    // 🆕 SỬ DỤNG PHÍ VẬN CHUYỂN TỪ FRONTEND - XÓA PHẦN TẠM TÍNH
    const tongTienTruocKM = tongTienSanPham + PhiVanChuyen;

    console.log("💰 Tính toán tiền:", {
      tongTienSanPham,
      PhiVanChuyen, // 🆕 SỬ DỤNG PHÍ TỪ FRONTEND
      tongTienTruocKM,
    });

    // === 7.1. Áp dụng mã khuyến mãi nếu có ===
    let tongTienSauKM = tongTienTruocKM;
    let giamGia = 0;
    let maKMApDung = null;

    if (appliedVouchers && appliedVouchers.length > 0) {
      console.log("🎫 Áp dụng voucher:", appliedVouchers);
      for (const maKM of appliedVouchers) {
        const userKM = await khuyenmai_taikhoan.findOne({
          where: { MaKM: maKM, MaTK },
          transaction,
        });

        if (!userKM) {
          await transaction.rollback();
          console.log("❌ User không có voucher:", maKM);
          return res.status(400).json({
            message: `Mã khuyến mãi ${maKM} không hợp lệ`,
          });
        }

        const km = await khuyenmai.findOne({
          where: { MaKM: maKM },
          transaction,
        });

        if (!km) {
          await transaction.rollback();
          console.log("❌ Không tìm thấy voucher:", maKM);
          return res
            .status(404)
            .json({ message: `Không tìm thấy mã khuyến mãi ${maKM}` });
        }

        // Kiểm tra thời hạn
        const now = new Date();
        if (now < km.NgayBatDau || now > km.NgayKetThuc) {
          await transaction.rollback();
          console.log("❌ Voucher hết hạn:", maKM);
          return res
            .status(400)
            .json({ message: `Mã khuyến mãi ${maKM} đã hết hạn` });
        }

        // Tính giảm giá
        let discountAmount = 0;
        if (km.HinhThucGiam === "FIXED") {
          discountAmount = Math.min(km.GiaTriGiam, tongTienSauKM);
        } else if (km.HinhThucGiam === "PERCENT") {
          discountAmount = tongTienSauKM * (km.GiaTriGiam / 100);
          if (km.SoTienGiamToiDa && discountAmount > km.SoTienGiamToiDa) {
            discountAmount = km.SoTienGiamToiDa;
          }
        }

        giamGia += discountAmount;
        tongTienSauKM -= discountAmount;
        maKMApDung = maKM;

        // Cập nhật số lần đã sử dụng
        await khuyenmai_taikhoan.update(
          { SoLanSuDung: userKM.SoLanSuDung + 1 },
          {
            where: { MaKM: maKM, MaTK },
            transaction,
          }
        );

        console.log(`✅ Áp dụng voucher ${maKM}, giảm: ${discountAmount}`);
      }
    }

    // Đảm bảo tổng tiền không âm
    tongTienSauKM = Math.max(0, tongTienSauKM);

    console.log("🎯 Tổng tiền cuối cùng:", {
      tongTienSauKM,
      giamGia,
      maKMApDung,
    });

    // Tạo đơn hàng - 🆕 SỬ DỤNG PhiVanChuyen TỪ FRONTEND
    const newDonHang = await donhang.create(
      {
        MaDH,
        MaTK,
        DCNhanHang: DCNhanHang.trim(),
        MaPTVC: MaPTVC || "VC_STANDARD",
        MaPTTT: MaPTTT || "TT01",
        TongTien: tongTienSauKM,
        GiamGia: giamGia,
        PhiVanChuyen: PhiVanChuyen, // 🆕 SỬ DỤNG TỪ FRONTEND
        MaKM: maKMApDung,
        TrangThai: "Chờ xác nhận",
        NgayTao: new Date(),
      },
      { transaction }
    );

    console.log("✅ Đã tạo đơn hàng:", MaDH);

    // === 7.2. Tạo bản ghi thanh toán ===
    const ptttRecord = await pttt.findByPk(MaPTTT, { transaction });
    if (!ptttRecord) {
      await transaction.rollback();
      console.log("❌ Phương thức thanh toán không hợp lệ:", MaPTTT);
      return res
        .status(400)
        .json({ message: "Phương thức thanh toán không hợp lệ" });
    }

    const isCOD = ptttRecord.TenPTTT.toLowerCase().includes("cod");
    const paymentStatus = isCOD ? "Chờ khách thanh toán" : "Đã thanh toán";

    const MaTT =
      "TT" + uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();

    const dataThanhToan = {
      MaTT,
      MaDH: newDonHang.MaDH,
      Sotien: tongTienSauKM,
      TrangThai: paymentStatus,
      MaPTTT,
    };

    if (paymentStatus === "Đã thanh toán") {
      dataThanhToan.NgayTao = new Date();
      dataThanhToan.Thoigian = new Date().toLocaleTimeString("vi-VN", {
        hour12: false,
        timeZone: "Asia/Ho_Chi_Minh",
      });
    }

    await thanhtoan.create(dataThanhToan, { transaction });
    console.log("✅ Đã tạo bản ghi thanh toán:", MaTT);

    // === 8. Tạo chi tiết đơn hàng ===
    console.log("📝 Tạo chi tiết đơn hàng...");
    for (let ct of selectedItems) {
      await chitiet_donhang.create(
        {
          MaDH: newDonHang.MaDH,
          MaSP: ct.MaSP,
          TenSP: ct.MaSP_sanpham.TenSP,
          SoLuong: ct.SL,
          GiaBan: ct.MaSP_sanpham.GiaBan,
        },
        { transaction }
      );
      console.log(`✅ Đã thêm sản phẩm ${ct.MaSP} vào đơn hàng`);
    }

    // === 9. Xóa các sản phẩm đã checkout khỏi giỏ ===
    const MaSPs = selectedItems.map((ct) => ct.MaSP);
    await ctgh.destroy({
      where: { MaGH: cart.MaGH, MaSP: MaSPs },
      transaction,
    });
    console.log("✅ Đã xóa sản phẩm khỏi giỏ hàng");

    // === 10. Nếu giỏ hàng trống => xóa giỏ ===
    const remaining = await ctgh.count({
      where: { MaGH: cart.MaGH },
      transaction,
    });

    if (remaining === 0) {
      await giohang.destroy({
        where: { MaGH: cart.MaGH },
        transaction,
      });
      console.log("✅ Đã xóa giỏ hàng trống");
    }

    // Commit transaction
    await transaction.commit();
    console.log("✅ Transaction committed");

    // === 11. Kết quả ===
    console.log("🎉 Đơn hàng tạo thành công:", MaDH);

    return res.json({
      success: true,
      MaDH,
      data: {
        MaDH,
        TongTien: tongTienSauKM,
        PhiVanChuyen: PhiVanChuyen, // 🆕 TRẢ VỀ PHÍ VẬN CHUYỂN
        GiamGia: giamGia,
        SoSanPham: selectedItems.length,
      },
    });
  } catch (err) {
    // Rollback transaction nếu có lỗi
    if (transaction) {
      await transaction.rollback();
      console.log("❌ Transaction rolled back");
    }

    console.error("❌ Lỗi process checkout:", err);
    console.error("❌ Stack trace:", err.stack);

    return res.status(500).json({
      message: "Lỗi server khi xử lý đơn hàng",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

export const orderSuccess = async (req, res) => {
  try {
    const { MaDH } = req.params;

    const order = await donhang.findOne({
      where: { MaDH },
      include: [{ model: chitiet_donhang, as: "chitiet_donhangs" }], // dùng alias đúng
    });

    if (!order)
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });

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

  let transaction;

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

    // ✅ Kiểm tra quyền người dùng (chỉ người đặt đơn mới được cập nhật)
    // if (order.MaTK !== userMaTK) {
    //   return res.status(403).json({
    //     message: "Bạn không có quyền thay đổi đơn hàng này"
    //   });
    // }

    // 🎯 VALIDATE TRẠNG THÁI - CHO PHÉP CHUYỂN "Đã giao hàng" → "Hoàn tất"
    const validTransitions = {
      "Chờ xác nhận": ["Hủy đơn hàng"],
      "Đang xử lý": ["Hủy đơn hàng"],
      "Đã giao hàng": ["Hoàn tất"], // 🆕 CHO PHÉP KHÁCH HÀNG XÁC NHẬN ĐÃ NHẬN HÀNG
    };

    const currentStatus = order.TrangThai;
    const allowedNextStatuses = validTransitions[currentStatus] || [];

    // 🆕 CHO PHÉP CHUYỂN TỪ "ĐÃ GIAO HÀNG" SANG "HOÀN TẤT"
    const isAllowedTransition =
      (currentStatus === "Đã giao hàng" && TrangThai === "Hoàn tất") ||
      allowedNextStatuses.includes(TrangThai);

    if (!isAllowedTransition) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ "${currentStatus}" sang "${TrangThai}"`,
      });
    }

    // 🗃️ Bắt đầu transaction
    transaction = await sequelize.transaction();
    console.log("✅ Transaction started for order update");

    // 👉 XỬ LÝ ĐẶC BIỆT THEO TRẠNG THÁI
    if (TrangThai === "Hủy đơn hàng") {
      console.log("🔄 Xử lý hủy đơn hàng...");

      const chiTietList = await chitiet_donhang.findAll({
        where: { MaDH },
        transaction,
      });

      if (!chiTietList || chiTietList.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Đơn hàng không có sản phẩm để hoàn",
        });
      }

      // 🔄 Hoàn lại tồn kho
      console.log("📦 Hoàn lại tồn kho...");
      for (const ct of chiTietList) {
        const sp = await sanpham.findByPk(ct.MaSP, { transaction });
        if (sp) {
          sp.SLTon += ct.SoLuong;
          await sp.save({ transaction });
          console.log(`✅ Đã hoàn lại ${ct.SoLuong} sản phẩm ${ct.MaSP}`);
        }
      }

      // 🔄 Hoàn lại số lần sử dụng mã KM nếu có
      if (order.MaKM) {
        console.log("🎫 Hoàn lại số lần sử dụng mã khuyến mãi...");
        const userKM = await khuyenmai_taikhoan.findOne({
          where: { MaKM: order.MaKM, MaTK: order.MaTK },
          transaction,
        });

        if (userKM && userKM.SoLanSuDung > 0) {
          await khuyenmai_taikhoan.update(
            { SoLanSuDung: userKM.SoLanSuDung - 1 },
            {
              where: { MaKM: order.MaKM, MaTK: order.MaTK },
              transaction,
            }
          );
          console.log(`✅ Đã hoàn lại 1 lần sử dụng mã KM: ${order.MaKM}`);
        }
      }

      // 🔄 Trả lại giỏ hàng
      console.log("🛒 Trả sản phẩm vào giỏ hàng...");
      let cart = await giohang.findOne({
        where: { MaTK: order.MaTK },
        transaction,
      });

      if (!cart) {
        cart = await giohang.create(
          {
            MaGH:
              "GH" + Math.random().toString(36).substring(2, 10).toUpperCase(),
            MaTK: order.MaTK,
          },
          { transaction }
        );
        console.log("✅ Đã tạo giỏ hàng mới");
      }

      for (const ct of chiTietList) {
        let item = await ctgh.findOne({
          where: { MaGH: cart.MaGH, MaSP: ct.MaSP },
          transaction,
        });

        if (item) {
          item.SL += ct.SoLuong;
          item.TongTien = item.SL * ct.GiaBan;
          await item.save({ transaction });
          console.log(`✅ Đã cập nhật sản phẩm ${ct.MaSP} trong giỏ`);
        } else {
          await ctgh.create(
            {
              MaGH: cart.MaGH,
              MaSP: ct.MaSP,
              SL: ct.SoLuong,
              TongTien: ct.GiaBan * ct.SoLuong,
            },
            { transaction }
          );
          console.log(`✅ Đã thêm sản phẩm ${ct.MaSP} vào giỏ`);
        }
      }
    }

    // 📝 GHI LỊCH SỬ TRẠNG THÁI
    if (lichsu_trangthai) {
      let ghiChu = "";

      if (TrangThai === "Hoàn tất") {
        ghiChu = "Khách hàng xác nhận đã nhận hàng";
      } else if (TrangThai === "Hủy đơn hàng") {
        ghiChu = "Khách hàng đã hủy đơn hàng";
      } else {
        ghiChu = `Cập nhật trạng thái: ${currentStatus} → ${TrangThai}`;
      }

      await lichsu_trangthai.create(
        {
          MaLS: "LS" + uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase(),
          MaDH: order.MaDH,
          TrangThaiCu: currentStatus,
          TrangThaiMoi: TrangThai,
          NgayCapNhat: new Date(),
          NguoiCapNhat: userMaTK,
          GhiChu: ghiChu,
        },
        { transaction }
      );

      console.log("📝 Đã ghi lịch sử trạng thái");
    }

    // ✅ CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
    if (order.TrangThai !== TrangThai) {
      await donhang.update(
        {
          TrangThai,
          NgayCapNhat: new Date(),
        },
        {
          where: { MaDH },
          transaction,
        }
      );

      console.log(
        `✅ Đã cập nhật đơn hàng ${MaDH}: ${currentStatus} → ${TrangThai}`
      );
    } else {
      console.log(`⚠️ Trạng thái không đổi cho đơn ${MaDH} → Không update`);
    }

    // 🆕 [THÊM MỚI] LOGIC CỘNG TIỀN KHI HOÀN TẤT ĐƠN HÀNG
    if (TrangThai === "Hoàn tất") {
      console.log("💰 Bắt đầu tính toán doanh thu cho cửa hàng...");

      // 1. Lấy chi tiết đơn hàng kèm thông tin sản phẩm và cửa hàng
      const orderDetails = await chitiet_donhang.findAll({
        where: { MaDH },
        include: [
          {
            model: sanpham,
            as: "MaSP_sanpham",
            attributes: ["MaCH", "GiaBan"], // Cần MaCH để biết cộng cho ai
          },
        ],
        transaction,
      });

      // 2. Gom nhóm doanh thu theo cửa hàng
      // (Vì 1 đơn hàng có thể chứa sản phẩm của nhiều cửa hàng khác nhau)
      const revenueByShop = {};

      for (const item of orderDetails) {
        const maCH = item.MaSP_sanpham.MaCH;
        // Tính tiền: Số lượng * Giá bán (Cộng đúng số tiền bán sp)
        const amount = parseFloat(item.GiaBan) * item.SoLuong;

        if (!revenueByShop[maCH]) {
          revenueByShop[maCH] = 0;
        }
        revenueByShop[maCH] += amount;
      }

      // 3. Thực hiện cộng tiền và ghi log giao dịch
      for (const [maCH, totalAmount] of Object.entries(revenueByShop)) {
        // Lấy thông tin cửa hàng hiện tại để biết số dư cũ (để an toàn)
        const store = await cuahang.findByPk(maCH, { transaction });

        if (store) {
          // Cộng tiền vào số dư
          const newBalance = parseFloat(store.SoDu) + totalAmount;

          await cuahang.update(
            { SoDu: newBalance },
            { where: { MaCH: maCH }, transaction }
          );

          // Tạo mã giao dịch
          const MaGD =
            "GD" + uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();

          // Ghi lịch sử giao dịch ví
          await giaodich_vi.create(
            {
              MaGD: MaGD,
              MaCH: maCH,
              LoaiGD: "NHAN_TIEN_DON_HANG", // Loại giao dịch: Nhận tiền
              SoTien: totalAmount,
              NoiDung: `Doanh thu từ đơn hàng ${MaDH}`,
              TrangThai: "ThanhCong",
              NgayTao: new Date(),
            },
            { transaction }
          );

          console.log(`✅ Đã cộng ${totalAmount} vào ví cửa hàng ${maCH}`);
        }
      }
    }

    // ✅ COMMIT TRANSACTION
    await transaction.commit();
    console.log("✅ Transaction committed successfully");

    // 🎯 THÔNG BÁO THÀNH CÔNG
    let successMessage = "";

    if (TrangThai === "Hoàn tất") {
      successMessage = "Đã xác nhận nhận hàng! Cảm ơn bạn đã mua sắm.";
    } else if (TrangThai === "Hủy đơn hàng") {
      successMessage =
        "Đã hủy đơn hàng thành công. Sản phẩm đã được trả lại giỏ hàng.";
    } else {
      successMessage = `Đã cập nhật trạng thái đơn hàng: ${TrangThai}`;
    }

    return res.json({
      success: true,
      message: successMessage,
      data: {
        MaDH,
        TrangThaiCu: currentStatus,
        TrangThaiMoi: TrangThai,
        NgayCapNhat: new Date(),
      },
    });
  } catch (err) {
    // ❌ ROLLBACK NẾU CÓ LỖI
    if (transaction) {
      await transaction.rollback();
      console.log("❌ Transaction rolled back due to error");
    }

    console.error("❌ Lỗi cập nhật trạng thái đơn hàng:", err);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật trạng thái đơn hàng",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
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

export const getAllOrder = async (req, res) => {
  try {
    console.log("=== BẮT ĐẦU GET ALL ORDERS ===");

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ message: "Token không hợp lệ hoặc hết hạn" });
    }

    const MaTK = decoded.MaTK;

    // Lấy tất cả đơn hàng của user
    const orders = await donhang.findAll({
      where: { MaTK },
      include: [
        {
          model: chitiet_donhang, // Model chi tiết
          as: "chitiet_donhangs", // Alias (kiểm tra lại trong init-models nếu lỗi)
          include: [
            {
              model: sanpham,
              as: "MaSP_sanpham",
              // 👇 SỬA 1: XÓA "HinhAnh" Ở ĐÂY ĐỂ TRÁNH LỖI DB
              attributes: ["TenSP"],
              include: [
                {
                  model: hinhanh,
                  as: "hinhanhs",
                  attributes: ["URL"],
                },
              ],
            },
          ],
        },
        {
          model: pttt,
          as: "MaPTTT_pttt",
          attributes: ["TenPTTT"],
        },
        {
          model: ptvc,
          as: "MaPTVC_ptvc",
          attributes: ["TenPTVC"],
        },
      ],
      order: [["NgayTao", "DESC"]],
    });

    const statusCounts = {
      "Chờ xác nhận": 0,
      "Chờ lấy hàng": 0,
      "Chờ giao hàng": 0,
      "Đã giao hàng": 0,
      "Hoàn thành": 0,
      "Trả hàng": 0,
      "Đã hủy": 0,
    };

    orders.forEach((order) => {
      if (statusCounts.hasOwnProperty(order.TrangThai)) {
        statusCounts[order.TrangThai]++;
      }
    });

    // 👇 SỬA 2: LOGIC LẤY ẢNH TỪ MẢNG RA LÀM ẢNH ĐẠI DIỆN
    const formattedOrders = orders.map((order) => {
      const orderData = order.get({ plain: true });

      return {
        ...orderData,
        chitiet_donhangs: orderData.chitiet_donhangs.map((item) => {
          const product = item.MaSP_sanpham;

          // Lấy ảnh đầu tiên trong mảng làm ảnh đại diện
          const mainImage =
            product.hinhanhs && product.hinhanhs.length > 0
              ? product.hinhanhs[0].URL
              : null;

          return {
            ...item,
            TenSP: product.TenSP,
            HinhAnh: mainImage, // ✅ Gán ảnh lấy được vào đây
            hinhanhs: product.hinhanhs || [],
          };
        }),
      };
    });

    console.log("📊 Thống kê trạng thái:", statusCounts);

    return res.json({
      success: true,
      data: {
        orders: formattedOrders,
        statusCounts: {
          "Tất cả": orders.length,
          ...statusCounts,
        },
        totalOrders: orders.length,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách đơn hàng:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách đơn hàng",
      error: err.message, // Trả về chi tiết lỗi để dễ debug
    });
  }
};
// Hàm lấy đơn hàng theo trạng thái
export const getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const MaTK = decoded.MaTK;

    let whereCondition = { MaTK };

    if (status !== "Tất cả") {
      whereCondition.TrangThai = status;
    }

    const orders = await donhang.findAll({
      where: whereCondition,
      include: [
        {
          model: chitiet_donhang,
          as: "chitiet_donhangs",
          include: [
            {
              model: sanpham,
              as: "MaSP_sanpham",
              attributes: ["TenSP"],
            },
          ],
        },
        {
          model: pttt,
          as: "MaPTTT_pttt",
          attributes: ["TenPTTT"],
        },
        {
          model: ptvc,
          as: "MaPTVC_ptvc",
          attributes: ["TenPTVC"],
        },
        // {
        //   model: thanhtoan,
        //   as: "thanhtoan", // ← SỬA ALIAS Ở ĐÂY NỮA
        //   attributes: ['TrangThai', 'Sotien', 'NgayTao']
        // }
      ],
      order: [["NgayTao", "DESC"]],
    });

    return res.json({
      success: true,
      data: orders,
    });
  } catch (err) {
    console.error("Lỗi khi lấy đơn hàng theo trạng thái:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy đơn hàng",
    });
  }
};

// 🆕 API tính phí vận chuyển với khoảng cách thực tế từ HDBanHang
export const calculateShipping = async (req, res) => {
  try {
    const { deliveryAddress, items, deliverySpeed = "standard" } = req.body;

    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: "Thiếu địa chỉ giao hàng",
      });
    }

    // === LẤY ĐỊA CHỈ LẤY HÀNG ===
    const shopAddress = await getShopPickupAddress();
    if (!shopAddress) {
      return res.status(500).json({
        success: false,
        message: "Hệ thống chưa được cấu hình địa chỉ lấy hàng.",
      });
    }

    console.log("📍 Tính khoảng cách:", {
      from: shopAddress,
      to: deliveryAddress,
    });

    // === TÍNH KHOẢNG CÁCH NỘI BỘ ===
    const distanceResult = await DistanceCalculator.calculateRealDistance(
      shopAddress,
      deliveryAddress
    );

    console.log("📏 Khoảng cách tính được:", distanceResult);

    // === TÍNH PHÍ VẬN CHUYỂN ===
    const shippingOptions = calculateShippingByRealDistance(
      distanceResult,
      items,
      deliverySpeed,
      deliveryAddress
    );

    // KIỂM TRA NẾU KHÔNG CÓ PHƯƠNG THỨC NÀO KHẢ DỤNG
    if (!shippingOptions || shippingOptions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có phương thức vận chuyển khả dụng cho địa chỉ này.",
        distanceInfo: distanceResult,
      });
    }

    return res.json({
      success: true,
      data: shippingOptions,
      distanceInfo: distanceResult,
    });
  } catch (error) {
    console.error("❌ Lỗi tính phí vận chuyển:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi tính phí vận chuyển",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// 🆕 Hàm tính phí vận chuyển chính xác
const calculateAccurateShippingFee = async (distanceResult, items, maPTVC) => {
  const { distance } = distanceResult;

  // Tính tổng trọng lượng
  const totalWeight = items.reduce((total, item) => {
    return total + item.SL * 0.5; // Giả sử mỗi SP 0.5kg
  }, 0);

  // Phí cơ bản theo km
  const baseCostPerKm = 2500;
  const baseDistanceCost = Math.round(distance * baseCostPerKm);

  // Phí theo trọng lượng
  const weightCostPerKg = 5000;
  const weightCost = Math.max(totalWeight * weightCostPerKg, 5000);

  const baseCost = baseDistanceCost + weightCost;

  // Hệ số theo phương thức vận chuyển
  const shippingMultipliers = {
    VC03: 1,
    VC04: 1.3,
    VC05: 1.8,
    VC06: 2.5,
    VC01: 1, // Fallback cho mã cũ
    VC02: 1.3, // Fallback cho mã cũ
  };

  const multiplier = shippingMultipliers[maPTVC] || 1;

  // Phí dịch vụ cố định
  const serviceFees = {
    VC03: 0,
    VC04: 10000,
    VC05: 20000,
    VC06: 30000,
    VC01: 0,
    VC02: 10000,
  };

  const serviceFee = serviceFees[maPTVC] || 0;

  return Math.round(baseCost * multiplier + serviceFee);
};

// 🆕 Hàm lấy địa chỉ lấy hàng - TRẢ VỀ NULL NẾU KHÔNG CÓ
const getShopPickupAddress = async () => {
  try {
    const latestContract = await hdbanhang.findOne({
      order: [["NgayLap", "DESC"]],
      attributes: ["DCLayHang", "MaHD", "NgayLap"],
    });

    if (!latestContract || !latestContract.DCLayHang?.trim()) {
      console.error("❌ Không tìm thấy địa chỉ lấy hàng trong HDBanHang");
      return null;
    }

    console.log("✅ Lấy địa chỉ từ HDBanHang:", latestContract.DCLayHang);
    return latestContract.DCLayHang.trim();
  } catch (error) {
    console.error("❌ Lỗi lấy địa chỉ từ HDBanHang:", error);
    return null;
  }
};

// 🆕 Hàm tính phí vận chuyển dựa trên khoảng cách thực
const calculateShippingByRealDistance = (
  distanceResult,
  items,
  deliverySpeed,
  deliveryAddress
) => {
  const { distance, duration } = distanceResult;

  console.log("💰 Tính phí với khoảng cách:", {
    distance: distance + "km",
    duration: duration + "phút",
    deliverySpeed,
  });

  // Tính tổng trọng lượng (giả sử mỗi SP 0.5kg)
  const totalWeight = items.reduce((total, item) => {
    return total + item.SL * 0.5;
  }, 0);

  // CÔNG THỨC TÍNH PHÍ THỰC TẾ
  const baseCostPerKm = 2500; // 2,500 VNĐ/km
  const baseDistanceCost = Math.round(distance * baseCostPerKm);

  const weightCostPerKg = 5000; // 5,000 VNĐ/kg
  const weightCost = Math.max(totalWeight * weightCostPerKg, 5000); // Tối thiểu 5k

  const baseCost = baseDistanceCost + weightCost;

  // Hệ số tốc độ
  const speedMultipliers = {
    standard: 1,
    fast: 1.3,
    express: 1.8,
    super_express: 2.5,
  };

  const speedMultiplier = speedMultipliers[deliverySpeed] || 1;

  // Phí dịch vụ cố định theo tốc độ
  const serviceFees = {
    standard: 0,
    fast: 10000,
    express: 20000,
    super_express: 30000,
  };

  const totalCost = Math.round(
    baseCost * speedMultiplier + serviceFees[deliverySpeed]
  );

  // Thời gian giao hàng thực tế
  const getRealDeliveryTime = (speed) => {
    const speedTimeFactors = {
      standard: 2.0,
      fast: 1.3,
      express: 1.0,
      super_express: 0.7,
    };

    const estimatedMinutes = Math.round(duration * speedTimeFactors[speed]);

    // Thêm thời gian xử lý đơn hàng
    const processingTime = {
      standard: 120, // 2 giờ
      fast: 60, // 1 giờ
      express: 30, // 30 phút
      super_express: 15, // 15 phút
    };

    const totalMinutes = estimatedMinutes + processingTime[speed];

    if (totalMinutes < 60) {
      return `${totalMinutes} phút`;
    } else if (totalMinutes < 1440) {
      const hours = Math.round(totalMinutes / 60);
      return `${hours} giờ`;
    } else {
      const days = Math.round(totalMinutes / 1440);
      return `${days} ngày`;
    }
  };

  // Kiểm tra khu vực hỗ trợ tốc độ cao
  const isUrbanArea = (address) => {
    const urbanDistricts = [
      "q1",
      "q3",
      "q5",
      "ba đình",
      "hoàn kiếm",
      "hai bà trưng",
    ];
    return urbanDistricts.some((district) =>
      address.toLowerCase().includes(district)
    );
  };

  const isPeakHours = () => {
    const now = new Date();
    const hour = now.getHours();
    return (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
  };

  const results = [
    {
      MaPTVC: "VC03",
      TenPTVC: "Giao hàng tiêu chuẩn",
      PhiVanChuyen: Math.round(baseCost + serviceFees.standard),
      ThoiGianGiaoHang: getRealDeliveryTime("standard"),
      TocDo: "standard",
      estimatedDelivery: calculateEstimatedDelivery("standard", duration),
      isAvailable: distance <= 100, // Hỗ trợ đến 100km
      UuDai: ["Miễn phí đổi trả trong 7 ngày"],
      distance: distance,
      duration: duration,
      weight: totalWeight,
    },
    {
      MaPTVC: "VC04",
      TenPTVC: "Giao hàng nhanh",
      PhiVanChuyen: Math.round(
        baseCost * speedMultipliers.fast + serviceFees.fast
      ),
      ThoiGianGiaoHang: getRealDeliveryTime("fast"),
      TocDo: "fast",
      estimatedDelivery: calculateEstimatedDelivery("fast", duration),
      isAvailable: distance <= 80,
      UuDai: ["Hỗ trợ 24/7", "Đổi trả nhanh"],
      distance: distance,
      duration: duration,
      weight: totalWeight,
    },
    {
      MaPTVC: "vc05",
      TenPTVC: "Giao hàng hỏa tốc",
      PhiVanChuyen: Math.round(
        baseCost * speedMultipliers.express + serviceFees.express
      ),
      ThoiGianGiaoHang: getRealDeliveryTime("express"),
      TocDo: "express",
      estimatedDelivery: calculateEstimatedDelivery("express", duration),
      isAvailable: distance <= 50 && isUrbanArea(deliveryAddress),
      UuDai: ["Ưu tiên xử lý", "Theo dõi real-time"],
      distance: distance,
      duration: duration,
      weight: totalWeight,
    },
    {
      MaPTVC: "vc06",
      TenPTVC: "Giao hàng siêu tốc",
      PhiVanChuyen: Math.round(
        baseCost * speedMultipliers.super_express + serviceFees.super_express
      ),
      ThoiGianGiaoHang: getRealDeliveryTime("super_express"),
      TocDo: "super_express",
      estimatedDelivery: calculateEstimatedDelivery("super_express", duration),
      isAvailable:
        distance <= 30 && isUrbanArea(deliveryAddress) && !isPeakHours(),
      UuDai: ["Xử lý ưu tiên cao nhất", "Giám sát 24/7"],
      distance: distance,
      duration: duration,
      weight: totalWeight,
    },
  ];

  // Lọc chỉ các phương thức khả dụng
  const availableOptions = results.filter((option) => option.isAvailable);

  console.log(`🎯 Có ${availableOptions.length} phương thức khả dụng`);
  return availableOptions;
};

// 🆕 Hàm tính thời gian giao hàng ước tính
const calculateEstimatedDelivery = (speed, baseDuration) => {
  const now = new Date();
  const speedTimeFactors = {
    standard: 2.0,
    fast: 1.3,
    express: 1.0,
    super_express: 0.7,
  };

  const totalMinutes = Math.round(baseDuration * speedTimeFactors[speed]);
  const deliveryTime = new Date(now.getTime() + totalMinutes * 60000);

  return deliveryTime.toLocaleString("vi-VN", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
};

// 🆕 Fallback khi API distance fail
const calculateDistanceFallback = async (origin, destination) => {
  console.log("🔄 Using fallback distance calculation");

  // Simple estimation based on address similarity
  const isSameProvince =
    (origin.includes("Hồ Chí Minh") && destination.includes("Hồ Chí Minh")) ||
    (origin.includes("Hà Nội") && destination.includes("Hà Nội"));

  if (isSameProvince) {
    return {
      distance: 15,
      duration: 38,
      source: "fallback_estimation",
    };
  } else {
    return {
      distance: 50,
      duration: 125,
      source: "fallback_estimation",
    };
  }
};

// 🆕 LẤY ĐƠN HÀNG THEO CỬA HÀNG - CHO ORDER MANAGER
export const getStoreOrders = async (req, res) => {
  try {
    console.log("=== LẤY ĐƠN HÀNG THEO CỬA HÀNG ===");

    const { MaCH } = req.params;
    const { TrangThai, page = 1, limit = 10 } = req.query;

    console.log("📋 Tham số:", { MaCH, TrangThai, page, limit });

    // 🛡️ Xác thực token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    // 🔍 Kiểm tra quyền truy cập cửa hàng
    const store = await cuahang.findOne({ where: { MaCH } });
    if (!store) {
      return res.status(404).json({ message: "Không tìm thấy cửa hàng" });
    }

    if (store.MaTK !== decoded.MaTK) {
      return res
        .status(403)
        .json({ message: "Không có quyền truy cập cửa hàng này" });
    }

    // 📊 Xây dựng điều kiện query - SỬA PHẦN NÀY
    const whereCondition = {};

    // Lọc đơn hàng theo sản phẩm của cửa hàng - SỬ DỤNG Op.in
    whereCondition.MaDH = {
      [Op.in]: sequelize.literal(`(
        SELECT DISTINCT dh.MaDH 
        FROM donhang dh
        JOIN chitiet_donhang ctdh ON dh.MaDH = ctdh.MaDH
        JOIN sanpham sp ON ctdh.MaSP = sp.MaSP
        WHERE sp.MaCH = '${MaCH}'
      )`),
    };

    // Lọc theo trạng thái nếu có - SỬ DỤNG Op.eq
    if (TrangThai && TrangThai !== "all") {
      whereCondition.TrangThai = TrangThai;
    }

    // 📦 Lấy danh sách đơn hàng
    const offset = (page - 1) * limit;

    const orders = await donhang.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: chitiet_donhang,
          as: "chitiet_donhangs",
          include: [
            {
              model: sanpham,
              as: "MaSP_sanpham",
              where: { MaCH }, // Chỉ lấy sản phẩm của cửa hàng này
              attributes: ["TenSP", "MaSP", "DVT", "SLTon"],
            },
          ],
        },
        {
          model: taikhoan,
          as: "MaTK_taikhoan",
          attributes: ["TenDangNhap", "Email"],
        },
        {
          model: pttt,
          as: "MaPTTT_pttt",
          attributes: ["TenPTTT"],
        },
        {
          model: ptvc,
          as: "MaPTVC_ptvc",
          attributes: ["TenPTVC"],
        },
      ],
      order: [["NgayTao", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
      distinct: true, // Quan trọng cho count chính xác
    });

    console.log(`✅ Tìm thấy ${orders.count} đơn hàng cho cửa hàng ${MaCH}`);

    return res.json({
      success: true,
      data: {
        orders: orders.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: orders.count,
          totalPages: Math.ceil(orders.count / limit),
        },
      },
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy đơn hàng cửa hàng:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách đơn hàng",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// 🆕 CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG BỞI CỬA HÀNG
export const updateOrderStatusByStore = async (req, res) => {
  const { MaDH } = req.params;
  const { TrangThai, GhiChu } = req.body;

  console.log("🔄 Cập nhật trạng thái đơn hàng:", { MaDH, TrangThai, GhiChu });

  let transaction;
  try {
    // 🛡️ Xác thực token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
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

    // 🔍 Lấy đơn hàng và kiểm tra quyền
    const order = await donhang.findOne({
      where: { MaDH },
      include: [
        {
          model: chitiet_donhang,
          as: "chitiet_donhangs",
          include: [
            {
              model: sanpham,
              as: "MaSP_sanpham",
              attributes: ["MaCH", "TenSP"],
            },
          ],
        },
      ],
    });

    //  if (order.MaTK !== userMaTK) {
    //   return res
    //     .status(403)
    //     .json({ message: "Bạn không có quyền thay đổi đơn hàng này" });
    // }

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // 🔒 Kiểm tra đơn hàng có thuộc cửa hàng của user không
    const orderStoreIds = [
      ...new Set(
        order.chitiet_donhangs
          .map((ct) => ct.MaSP_sanpham?.MaCH)
          .filter(Boolean)
      ),
    ];

    const userStores = await cuahang.findAll({
      where: { MaTK: userMaTK },
      attributes: ["MaCH"],
    });
    const userStoreIds = userStores.map((store) => store.MaCH);

    const hasPermission = orderStoreIds.some((storeId) =>
      userStoreIds.includes(storeId)
    );

    if (!hasPermission) {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật đơn hàng này",
      });
    }

    // 🎯 VALIDATE TRẠNG THÁI THEO NGHIỆP VỤ
    const validTransitions = {
      "Chờ xác nhận": ["Đang chuẩn bị hàng", "Đã hủy"],
      "Đang chuẩn bị hàng": ["Chờ lấy hàng", "Đã hủy"],
      "Chờ lấy hàng": ["Đang giao hàng", "Đã hủy"],
      "Đã giao hàng": ["Hoàn tất"],
      "Đang giao hàng": ["Hoàn thành", "Đã hủy"],
      "Hoàn thành": [], // Không thể chuyển từ hoàn thành
      "Đã hủy": [], // Không thể chuyển từ đã hủy
    };

    const currentStatus = order.TrangThai;
    const allowedNextStatuses = validTransitions[currentStatus] || [];

    if (!allowedNextStatuses.includes(TrangThai)) {
      return res.status(400).json({
        message: `Không thể chuyển từ "${currentStatus}" sang "${TrangThai}"`,
      });
    }

    // 🗃️ Bắt đầu transaction
    transaction = await sequelize.transaction();

    // 📝 Ghi lịch sử trạng thái
    if (lichsu_trangthai) {
      await lichsu_trangthai.create(
        {
          MaLS: "LS" + uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase(),
          MaDH: order.MaDH,
          TrangThaiCu: currentStatus,
          TrangThaiMoi: TrangThai,
          NgayCapNhat: new Date(),
          NguoiCapNhat: userMaTK,
          GhiChu:
            GhiChu || `Cửa hàng cập nhật: ${currentStatus} → ${TrangThai}`,
        },
        { transaction }
      );
    }

    // 🔄 Cập nhật trạng thái đơn hàng
    await donhang.update(
      {
        TrangThai,
        NgayCapNhat: new Date(),
      },
      {
        where: { MaDH },
        transaction,
      }
    );

    if (currentStatus === "Đã giao hàng" && TrangThai === "Hoàn tất") {
      // Cho phép chuyển trạng thái
    } else if (!allowedNextStatuses.includes(TrangThai)) {
      return res.status(400).json({
        message: `Không thể chuyển từ "${currentStatus}" sang "${TrangThai}"`,
      });
    }

    // 📦 XỬ Lý ĐẶC BIỆT THEO TRẠNG THÁI
    if (TrangThai === "Đã hủy") {
      // Hoàn lại tồn kho khi hủy đơn
      for (const ct of order.chitiet_donhangs) {
        const sp = await sanpham.findByPk(ct.MaSP, { transaction });
        if (sp) {
          sp.SLTon += ct.SoLuong;
          await sp.save({ transaction });
          console.log(`✅ Đã hoàn lại ${ct.SoLuong} sản phẩm ${ct.MaSP}`);
        }
      }

      // Hoàn lại số lần sử dụng mã KM nếu có
      if (order.MaKM) {
        const userKM = await khuyenmai_taikhoan.findOne({
          where: { MaKM: order.MaKM, MaTK: order.MaTK },
          transaction,
        });
        if (userKM && userKM.SoLanSuDung > 0) {
          await khuyenmai_taikhoan.update(
            { SoLanSuDung: userKM.SoLanSuDung - 1 },
            {
              where: { MaKM: order.MaKM, MaTK: order.MaTK },
              transaction,
            }
          );
        }
      }
    }

    // ✅ Commit transaction
    await transaction.commit();
    console.log(
      `✅ Đã cập nhật đơn hàng ${MaDH}: ${currentStatus} → ${TrangThai}`
    );

    return res.json({
      success: true,
      message: `Đã cập nhật trạng thái đơn hàng thành: ${TrangThai}`,
      data: {
        MaDH,
        TrangThaiCu: currentStatus,
        TrangThaiMoi: TrangThai,
        NgayCapNhat: new Date(),
      },
    });
  } catch (err) {
    // ❌ Rollback nếu có lỗi
    if (transaction) {
      await transaction.rollback();
      console.log("❌ Transaction rolled back");
    }

    console.error("❌ Lỗi cập nhật trạng thái đơn hàng:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật trạng thái",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// 🆕 THỐNG KÊ ĐƠN HÀNG THEO CỬA HÀNG
export const getOrderStatistics = async (req, res) => {
  try {
    const { MaCH } = req.params;
    const { startDate, endDate } = req.query;

    console.log("📊 Thống kê đơn hàng:", { MaCH, startDate, endDate });

    // 🛡️ Xác thực token và quyền cửa hàng
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    // Kiểm tra quyền cửa hàng
    const store = await cuahang.findOne({ where: { MaCH } });
    if (!store || store.MaTK !== decoded.MaTK) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    // 📊 Xây dựng điều kiện thời gian
    const dateCondition = {};
    if (startDate) {
      dateCondition.NgayTao = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      dateCondition.NgayTao = {
        ...dateCondition.NgayTao,
        [Op.lte]: new Date(endDate + " 23:59:59"),
      };
    }

    // 🎯 THỐNG KÊ THEO TRẠNG THÁI
    const statusStats = await donhang.findAll({
      attributes: [
        "TrangThai",
        [sequelize.fn("COUNT", sequelize.col("MaDH")), "count"],
        [sequelize.fn("SUM", sequelize.col("TongTien")), "totalRevenue"],
      ],
      where: {
        ...dateCondition,
        MaDH: {
          [Op.in]: sequelize.literal(`(
            SELECT DISTINCT dh.MaDH 
            FROM donhang dh
            JOIN chitiet_donhang ctdh ON dh.MaDH = ctdh.MaDH
            JOIN sanpham sp ON ctdh.MaSP = sp.MaSP
            WHERE sp.MaCH = '${MaCH}'
          )`),
        },
      },
      group: ["TrangThai"],
      raw: true,
    });

    // 📈 TỔNG QUAN
    const totalStats = await donhang.findOne({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("MaDH")), "totalOrders"],
        [sequelize.fn("SUM", sequelize.col("TongTien")), "totalRevenue"],
        [sequelize.fn("AVG", sequelize.col("TongTien")), "avgOrderValue"],
      ],
      where: {
        ...dateCondition,
        MaDH: {
          [Op.in]: sequelize.literal(`(
            SELECT DISTINCT dh.MaDH 
            FROM donhang dh
            JOIN chitiet_donhang ctdh ON dh.MaDH = ctdh.MaDH
            JOIN sanpham sp ON ctdh.MaSP = sp.MaSP
            WHERE sp.MaCH = '${MaCH}'
          )`),
        },
      },
      raw: true,
    });

    // 🗓️ THỐNG KÊ THEO NGÀY (7 ngày gần nhất)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await donhang.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("NgayTao")), "date"],
        [sequelize.fn("COUNT", sequelize.col("MaDH")), "orderCount"],
        [sequelize.fn("SUM", sequelize.col("TongTien")), "dailyRevenue"],
      ],
      where: {
        NgayTao: { [Op.gte]: sevenDaysAgo },
        MaDH: {
          [Op.in]: sequelize.literal(`(
            SELECT DISTINCT dh.MaDH 
            FROM donhang dh
            JOIN chitiet_donhang ctdh ON dh.MaDH = ctdh.MaDH
            JOIN sanpham sp ON ctdh.MaSP = sp.MaSP
            WHERE sp.MaCH = '${MaCH}'
          )`),
        },
      },
      group: [sequelize.fn("DATE", sequelize.col("NgayTao"))],
      order: [[sequelize.fn("DATE", sequelize.col("NgayTao")), "ASC"]],
      raw: true,
    });

    // 🎯 Định dạng kết quả
    const statistics = {
      total: {
        orders: parseInt(totalStats.totalOrders) || 0,
        revenue: parseFloat(totalStats.totalRevenue) || 0,
        avgOrderValue: parseFloat(totalStats.avgOrderValue) || 0,
      },
      byStatus: statusStats.reduce((acc, stat) => {
        acc[stat.TrangThai] = {
          count: parseInt(stat.count),
          revenue: parseFloat(stat.totalRevenue) || 0,
        };
        return acc;
      }, {}),
      daily: dailyStats.map((stat) => ({
        date: stat.date,
        orderCount: parseInt(stat.orderCount),
        revenue: parseFloat(stat.dailyRevenue) || 0,
      })),
    };

    console.log(`✅ Thống kê cho cửa hàng ${MaCH}:`, statistics.total);

    return res.json({
      success: true,
      data: statistics,
    });
  } catch (err) {
    console.error("❌ Lỗi thống kê đơn hàng:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi thống kê đơn hàng",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// 🆕 CHI TIẾT ĐƠN HÀNG
export const getOrderDetail = async (req, res) => {
  try {
    const { MaDH } = req.params;

    console.log("📋 Lấy chi tiết đơn hàng:", MaDH);

    const order = await donhang.findOne({
      where: { MaDH },
      include: [
        {
          model: chitiet_donhang,
          as: "chitiet_donhangs",
          include: [
            {
              model: sanpham,
              as: "MaSP_sanpham",
              attributes: ["TenSP", "MaSP", "DVT", "SLTon", "GiaBan", "MaCH"],
            },
          ],
        },
        {
          model: taikhoan,
          as: "MaTK_taikhoan",
          attributes: ["TenDangNhap", "Email", "SoDienThoai"],
        },
        {
          model: pttt,
          as: "MaPTTT_pttt",
          attributes: ["TenPTTT"],
        },
        {
          model: ptvc,
          as: "MaPTVC_ptvc",
          attributes: ["TenPTVC", "MoTa"],
        },
        {
          model: lichsu_trangthai,
          as: "lichsu_trangthais",
          order: [["NgayCapNhat", "DESC"]],
          attributes: [
            "TrangThaiCu",
            "TrangThaiMoi",
            "NgayCapNhat",
            "GhiChu",
            "NguoiCapNhat",
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    console.log(`✅ Đã tìm thấy đơn hàng ${MaDH}`);

    return res.json({
      success: true,
      data: order,
    });
  } catch (err) {
    console.error("❌ Lỗi lấy chi tiết đơn hàng:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết đơn hàng",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
