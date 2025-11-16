import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import { DistanceCalculator } from '../services/distanceCalculator.js';

const models = initModels(sequelize);

const { donhang, chitiet_donhang, sanpham, ptvc, pttt, giohang, ctgh, taikhoan, lichsu_trangthai, khuyenmai, khuyenmai_taikhoan, thanhtoan, hdbanhang } = models;

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

// controllers/orderController.js - THÊM LOGGING CHI TIẾT
export const processCheckout = async (req, res) => {
  let transaction;
  try {
    console.log('=== BẮT ĐẦU PROCESS CHECKOUT ===');
    
    // === 1. Xác thực JWT ===
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      console.log('❌ Không có token');
      return res.status(401).json({ message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token decoded:', decoded.MaTK);
    } catch (err) {
      console.log('❌ Token không hợp lệ:', err.message);
      return res.status(401).json({ message: "Token không hợp lệ hoặc hết hạn" });
    }
    const MaTK = decoded.MaTK;

    // === 2. Lấy thông tin từ body ===
    const { DCNhanHang, MaPTVC, MaPTTT, items, appliedVouchers } = req.body;
    console.log('📦 Request body:', { 
      DCNhanHang, 
      MaPTVC, 
      MaPTTT, 
      itemsCount: items?.length,
      appliedVouchers 
    });

    if (!items || !items.length) {
      console.log('❌ Không có items');
      return res.status(400).json({ message: "Chưa chọn sản phẩm để thanh toán" });
    }

    if (!DCNhanHang?.trim()) {
      console.log('❌ Thiếu địa chỉ nhận hàng');
      return res.status(400).json({ message: "Địa chỉ nhận hàng không được để trống" });
    }

    // === 3. Lấy giỏ hàng của user ===
    console.log('🔍 Lấy giỏ hàng cho user:', MaTK);
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
      console.log('❌ Giỏ hàng trống');
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    console.log('✅ Tìm thấy giỏ hàng:', cart.MaGH, 'với', cart.ctghs.length, 'sản phẩm');

    // === 4. Lọc & cập nhật số lượng theo lựa chọn của user ===
    const selectedItems = cart.ctghs
      .filter(ct => items.some(i => i.MaSP === ct.MaSP))
      .map(ct => {
        const selected = items.find(i => i.MaSP === ct.MaSP);
        return {
          ...ct.dataValues,
          SL: selected.SL
        };
      });

    console.log('🛒 Selected items:', selectedItems.length);

    // === 5. Kiểm tra tồn kho ===
    console.log('🔍 Kiểm tra tồn kho...');
    for (let ct of selectedItems) {
      const sp = await sanpham.findByPk(ct.MaSP);
      if (!sp) {
        console.log('❌ Sản phẩm không tồn tại:', ct.MaSP);
        return res.status(400).json({ message: `Sản phẩm ${ct.MaSP} không tồn tại` });
      }
      if (sp.SLTon < ct.SL) {
        console.log('❌ Không đủ tồn kho:', ct.MaSP, 'cần', ct.SL, 'có', sp.SLTon);
        return res.status(400).json({ message: `Sản phẩm ${sp.TenSP} không đủ tồn kho` });
      }
    }

    // Bắt đầu transaction
    transaction = await sequelize.transaction();
    console.log('✅ Transaction started');

    // === 6. Trừ tồn kho ===
    console.log('📉 Trừ tồn kho...');
    for (let ct of selectedItems) {
      const sp = await sanpham.findByPk(ct.MaSP);
      sp.SLTon -= ct.SL;
      await sp.save({ transaction });
      console.log(`✅ Đã trừ ${ct.SL} sản phẩm ${ct.MaSP}, tồn kho còn: ${sp.SLTon}`);
    }

    // === 7. Tạo đơn hàng ===
    const MaDH = "DH" + uuidv4().replace(/-/g, "").substring(0, 8);
    
    // Tính tổng tiền sản phẩm
    const tongTienSanPham = selectedItems.reduce(
      (sum, ct) => sum + ct.SL * parseFloat(ct.MaSP_sanpham.GiaBan),
      0
    );

    // Tạm tính phí vận chuyển (có thể lấy từ frontend hoặc tính lại)
    const tempShippingFee = 30000; // Tạm thời, nên nhận từ frontend

    const tongTienTruocKM = tongTienSanPham + tempShippingFee;

    console.log('💰 Tính toán tiền:', {
      tongTienSanPham,
      tempShippingFee,
      tongTienTruocKM
    });

    // === 7.1. Áp dụng mã khuyến mãi nếu có ===
    let tongTienSauKM = tongTienTruocKM;
    let giamGia = 0;
    let maKMApDung = null;

    if (appliedVouchers && appliedVouchers.length > 0) {
      console.log('🎫 Áp dụng voucher:', appliedVouchers);
      for (const maKM of appliedVouchers) {
        const userKM = await khuyenmai_taikhoan.findOne({
          where: { MaKM: maKM, MaTK },
          transaction
        });

        if (!userKM) {
          await transaction.rollback();
          console.log('❌ User không có voucher:', maKM);
          return res.status(400).json({ 
            message: `Mã khuyến mãi ${maKM} không hợp lệ` 
          });
        }

        const km = await khuyenmai.findOne({ 
          where: { MaKM: maKM },
          transaction
        });

        if (!km) {
          await transaction.rollback();
          console.log('❌ Không tìm thấy voucher:', maKM);
          return res.status(404).json({ message: `Không tìm thấy mã khuyến mãi ${maKM}` });
        }

        // Kiểm tra thời hạn
        const now = new Date();
        if (now < km.NgayBatDau || now > km.NgayKetThuc) {
          await transaction.rollback();
          console.log('❌ Voucher hết hạn:', maKM);
          return res.status(400).json({ message: `Mã khuyến mãi ${maKM} đã hết hạn` });
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
            transaction 
          }
        );
        
        console.log(`✅ Áp dụng voucher ${maKM}, giảm: ${discountAmount}`);
      }
    }

    // Đảm bảo tổng tiền không âm
    tongTienSauKM = Math.max(0, tongTienSauKM);

    console.log('🎯 Tổng tiền cuối cùng:', {
      tongTienSauKM,
      giamGia,
      maKMApDung
    });

    // Tạo đơn hàng
    const newDonHang = await donhang.create({
      MaDH,
      MaTK,
      DCNhanHang: DCNhanHang.trim(),
      MaPTVC: MaPTVC || 'VC_STANDARD', // Đảm bảo có giá trị mặc định
      MaPTTT: MaPTTT || 'TT01', // Đảm bảo có giá trị mặc định
      TongTien: tongTienSauKM,
      GiamGia: giamGia,
      PhiVanChuyen: tempShippingFee,
      MaKM: maKMApDung,
      TrangThai: "Chờ xác nhận",
      NgayTao: new Date()
    }, { transaction });

    console.log('✅ Đã tạo đơn hàng:', MaDH);

    // === 7.2. Tạo bản ghi thanh toán ===
    const ptttRecord = await pttt.findByPk(MaPTTT, { transaction });
    if (!ptttRecord) {
      await transaction.rollback();
      console.log('❌ Phương thức thanh toán không hợp lệ:', MaPTTT);
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

    if (paymentStatus === "Đã thanh toán") {
      dataThanhToan.NgayTao = new Date();
      dataThanhToan.Thoigian = new Date().toLocaleTimeString("vi-VN", {
        hour12: false,
        timeZone: "Asia/Ho_Chi_Minh"
      });
    }

    await thanhtoan.create(dataThanhToan, { transaction });
    console.log('✅ Đã tạo bản ghi thanh toán:', MaTT);

    // === 8. Tạo chi tiết đơn hàng ===
    console.log('📝 Tạo chi tiết đơn hàng...');
    for (let ct of selectedItems) {
      await chitiet_donhang.create({
        MaDH: newDonHang.MaDH,
        MaSP: ct.MaSP,
        TenSP: ct.MaSP_sanpham.TenSP,
        SoLuong: ct.SL,
        GiaBan: ct.MaSP_sanpham.GiaBan
      }, { transaction });
      console.log(`✅ Đã thêm sản phẩm ${ct.MaSP} vào đơn hàng`);
    }

    // === 9. Xóa các sản phẩm đã checkout khỏi giỏ ===
    const MaSPs = selectedItems.map(ct => ct.MaSP);
    await ctgh.destroy({ 
      where: { MaGH: cart.MaGH, MaSP: MaSPs },
      transaction 
    });
    console.log('✅ Đã xóa sản phẩm khỏi giỏ hàng');

    // === 10. Nếu giỏ hàng trống => xóa giỏ ===
    const remaining = await ctgh.count({ 
      where: { MaGH: cart.MaGH },
      transaction 
    });
    
    if (remaining === 0) {
      await giohang.destroy({ 
        where: { MaGH: cart.MaGH },
        transaction 
      });
      console.log('✅ Đã xóa giỏ hàng trống');
    }

    // Commit transaction
    await transaction.commit();
    console.log('✅ Transaction committed');

    // === 11. Kết quả ===
    console.log('🎉 Đơn hàng tạo thành công:', MaDH);
    
    return res.json({ 
      success: true, 
      MaDH,
      data: {
        MaDH,
        TongTien: tongTienSauKM,
        PhiVanChuyen: tempShippingFee,
        GiamGia: giamGia,
        SoSanPham: selectedItems.length
      }
    });

  } catch (err) {
    // Rollback transaction nếu có lỗi
    if (transaction) {
      await transaction.rollback();
      console.log('❌ Transaction rolled back');
    }
    
    console.error('❌ Lỗi process checkout:', err);
    console.error('❌ Stack trace:', err.stack);
    
    return res.status(500).json({ 
      message: "Lỗi server khi xử lý đơn hàng",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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

// Thêm vào orderController.js
export const getAllOrder = async (req, res) => {
  try {
    console.log("=== BẮT ĐẦU GET ALL ORDERS ===");
    
    const authHeader = req.headers.authorization;
    console.log("Auth Header:", authHeader);
    
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ Không có token");
      return res.status(401).json({ message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token decoded:", decoded);
    } catch (err) {
      console.log("❌ Token không hợp lệ:", err.message);
      return res.status(401).json({ message: "Token không hợp lệ hoặc hết hạn" });
    }
    
    const MaTK = decoded.MaTK;
    console.log("📋 MaTK từ token:", MaTK);

    // Lấy tất cả đơn hàng của user - SỬA ALIAS THANHTOAN
    const orders = await donhang.findAll({
      where: { MaTK },
      include: [
        {
          model: chitiet_donhang,
          as: "chitiet_donhangs",
          include: [
            {
              model: sanpham,
              as: "MaSP_sanpham",
              attributes: ['TenSP']
            }
          ]
        },
        {
          model: pttt,
          as: "MaPTTT_pttt",
          attributes: ['TenPTTT']
        },
        {
          model: ptvc,
          as: "MaPTVC_ptvc",
          attributes: ['TenPTVC']
        },
        // {
        //   model: thanhtoan,
        //   as: "thanhtoan", // ← ALIAS CHÍNH XÁC THEO MODEL
        //   attributes: ['TrangThai', 'Sotien', 'NgayTao']
        // }
      ],
      order: [['NgayTao', 'DESC']]
    });

    console.log(`📦 Tìm thấy ${orders.length} đơn hàng cho user ${MaTK}`);

    // Đếm số lượng đơn hàng theo từng trạng thái
    const statusCounts = {
      'Chờ xác nhận': 0,
      'Chờ lấy hàng': 0,
      'Chờ giao hàng': 0,
      'Đã giao': 0,
      'Trả hàng': 0,
      'Đã hủy': 0
    };

    orders.forEach(order => {
      console.log(`Đơn hàng ${order.MaDH} - Trạng thái: ${order.TrangThai}`);
      if (statusCounts.hasOwnProperty(order.TrangThai)) {
        statusCounts[order.TrangThai]++;
      }
    });

    console.log("📊 Thống kê trạng thái:", statusCounts);

    return res.json({
      success: true,
      data: {
        orders,
        statusCounts: {
          'Tất cả': orders.length,
          ...statusCounts
        },
        totalOrders: orders.length
      }
    });

  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách đơn hàng:", err);
    return res.status(500).json({ 
      success: false,
      message: "Lỗi server khi lấy danh sách đơn hàng",
      error: err.message 
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
    
    if (status !== 'Tất cả') {
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
              attributes: ['TenSP']
            }
          ]
        },
        {
          model: pttt,
          as: "MaPTTT_pttt",
          attributes: ['TenPTTT']
        },
        {
          model: ptvc,
          as: "MaPTVC_ptvc",
          attributes: ['TenPTVC']
        },
        // {
        //   model: thanhtoan,
        //   as: "thanhtoan", // ← SỬA ALIAS Ở ĐÂY NỮA
        //   attributes: ['TrangThai', 'Sotien', 'NgayTao']
        // }
      ],
      order: [['NgayTao', 'DESC']]
    });

    return res.json({
      success: true,
      data: orders
    });

  } catch (err) {
    console.error("Lỗi khi lấy đơn hàng theo trạng thái:", err);
    return res.status(500).json({ 
      success: false,
      message: "Lỗi server khi lấy đơn hàng" 
    });
  }
};

// 🆕 API tính phí vận chuyển với khoảng cách thực tế từ HDBanHang
export const calculateShipping = async (req, res) => {
  try {
    const { deliveryAddress, items, deliverySpeed = 'standard' } = req.body;
    
    if (!deliveryAddress) {
      return res.status(400).json({ 
        success: false,
        message: "Thiếu địa chỉ giao hàng" 
      });
    }

    // === LẤY ĐỊA CHỈ LẤY HÀNG ===
    const shopAddress = await getShopPickupAddress();
    if (!shopAddress) {
      return res.status(500).json({ 
        success: false,
        message: "Hệ thống chưa được cấu hình địa chỉ lấy hàng." 
      });
    }

    console.log('📍 Tính khoảng cách:', {
      from: shopAddress,
      to: deliveryAddress
    });

    // === TÍNH KHOẢNG CÁCH NỘI BỘ ===
    const distanceResult = await DistanceCalculator.calculateRealDistance(
      shopAddress, 
      deliveryAddress
    );

    console.log('📏 Khoảng cách tính được:', distanceResult);

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
        distanceInfo: distanceResult
      });
    }

    return res.json({
      success: true,
      data: shippingOptions,
      distanceInfo: distanceResult
    });

  } catch (error) {
    console.error('❌ Lỗi tính phí vận chuyển:', error);
    return res.status(500).json({ 
      success: false,
      message: "Lỗi tính phí vận chuyển",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🆕 Hàm tính phí vận chuyển chính xác
const calculateAccurateShippingFee = async (distanceResult, items, maPTVC) => {
  const { distance } = distanceResult;
  
  // Tính tổng trọng lượng
  const totalWeight = items.reduce((total, item) => {
    return total + (item.SL * 0.5); // Giả sử mỗi SP 0.5kg
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
    'VC_STANDARD': 1,
    'VC_FAST': 1.3,
    'VC_EXPRESS': 1.8,
    'VC_SUPER_EXPRESS': 2.5,
    'VC01': 1,      // Fallback cho mã cũ
    'VC02': 1.3     // Fallback cho mã cũ
  };

  const multiplier = shippingMultipliers[maPTVC] || 1;
  
  // Phí dịch vụ cố định
  const serviceFees = {
    'VC_STANDARD': 0,
    'VC_FAST': 10000,
    'VC_EXPRESS': 20000,
    'VC_SUPER_EXPRESS': 30000,
    'VC01': 0,
    'VC02': 10000
  };

  const serviceFee = serviceFees[maPTVC] || 0;

  return Math.round(baseCost * multiplier + serviceFee);
};

// 🆕 Hàm lấy địa chỉ lấy hàng - TRẢ VỀ NULL NẾU KHÔNG CÓ
const getShopPickupAddress = async () => {
  try {
    const latestContract = await hdbanhang.findOne({
      order: [['NgayLap', 'DESC']],
      attributes: ['DCLayHang', 'MaHD', 'NgayLap']
    });

    if (!latestContract || !latestContract.DCLayHang?.trim()) {
      console.error('❌ Không tìm thấy địa chỉ lấy hàng trong HDBanHang');
      return null;
    }

    console.log('✅ Lấy địa chỉ từ HDBanHang:', latestContract.DCLayHang);
    return latestContract.DCLayHang.trim();
  } catch (error) {
    console.error('❌ Lỗi lấy địa chỉ từ HDBanHang:', error);
    return null;
  }
};

// 🆕 Hàm tính phí vận chuyển dựa trên khoảng cách thực
const calculateShippingByRealDistance = (distanceResult, items, deliverySpeed, deliveryAddress) => {
  const { distance, duration } = distanceResult;
  
  console.log('💰 Tính phí với khoảng cách:', { 
    distance: distance + 'km', 
    duration: duration + 'phút',
    deliverySpeed 
  });

  // Tính tổng trọng lượng (giả sử mỗi SP 0.5kg)
  const totalWeight = items.reduce((total, item) => {
    return total + (item.SL * 0.5);
  }, 0);

  // CÔNG THỨC TÍNH PHÍ THỰC TẾ
  const baseCostPerKm = 2500; // 2,500 VNĐ/km
  const baseDistanceCost = Math.round(distance * baseCostPerKm);
  
  const weightCostPerKg = 5000; // 5,000 VNĐ/kg
  const weightCost = Math.max(totalWeight * weightCostPerKg, 5000); // Tối thiểu 5k
  
  const baseCost = baseDistanceCost + weightCost;

  // Hệ số tốc độ
  const speedMultipliers = {
    'standard': 1,
    'fast': 1.3,
    'express': 1.8,
    'super_express': 2.5
  };

  const speedMultiplier = speedMultipliers[deliverySpeed] || 1;
  
  // Phí dịch vụ cố định theo tốc độ
  const serviceFees = {
    'standard': 0,
    'fast': 10000,
    'express': 20000,
    'super_express': 30000
  };

  const totalCost = Math.round(baseCost * speedMultiplier + serviceFees[deliverySpeed]);

  // Thời gian giao hàng thực tế
  const getRealDeliveryTime = (speed) => {
    const speedTimeFactors = {
      'standard': 2.0,
      'fast': 1.3,
      'express': 1.0,
      'super_express': 0.7
    };
    
    const estimatedMinutes = Math.round(duration * speedTimeFactors[speed]);
    
    // Thêm thời gian xử lý đơn hàng
    const processingTime = {
      'standard': 120, // 2 giờ
      'fast': 60,      // 1 giờ
      'express': 30,   // 30 phút
      'super_express': 15 // 15 phút
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
    const urbanDistricts = ['q1', 'q3', 'q5', 'ba đình', 'hoàn kiếm', 'hai bà trưng'];
    return urbanDistricts.some(district => address.toLowerCase().includes(district));
  };

  const isPeakHours = () => {
    const now = new Date();
    const hour = now.getHours();
    return (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
  };

  const results = [
    {
      MaPTVC: 'VC_STANDARD',
      TenPTVC: 'Giao hàng tiêu chuẩn',
      PhiVanChuyen: Math.round(baseCost + serviceFees.standard),
      ThoiGianGiaoHang: getRealDeliveryTime('standard'),
      TocDo: 'standard',
      estimatedDelivery: calculateEstimatedDelivery('standard', duration),
      isAvailable: distance <= 100, // Hỗ trợ đến 100km
      UuDai: ['Miễn phí đổi trả trong 7 ngày'],
      distance: distance,
      duration: duration,
      weight: totalWeight
    },
    {
      MaPTVC: 'VC_FAST',
      TenPTVC: 'Giao hàng nhanh',
      PhiVanChuyen: Math.round(baseCost * speedMultipliers.fast + serviceFees.fast),
      ThoiGianGiaoHang: getRealDeliveryTime('fast'),
      TocDo: 'fast',
      estimatedDelivery: calculateEstimatedDelivery('fast', duration),
      isAvailable: distance <= 80,
      UuDai: ['Hỗ trợ 24/7', 'Đổi trả nhanh'],
      distance: distance,
      duration: duration,
      weight: totalWeight
    },
    {
      MaPTVC: 'VC_EXPRESS',
      TenPTVC: 'Giao hàng hỏa tốc',
      PhiVanChuyen: Math.round(baseCost * speedMultipliers.express + serviceFees.express),
      ThoiGianGiaoHang: getRealDeliveryTime('express'),
      TocDo: 'express',
      estimatedDelivery: calculateEstimatedDelivery('express', duration),
      isAvailable: distance <= 50 && isUrbanArea(deliveryAddress),
      UuDai: ['Ưu tiên xử lý', 'Theo dõi real-time'],
      distance: distance,
      duration: duration,
      weight: totalWeight
    },
    {
      MaPTVC: 'VC_SUPER_EXPRESS',
      TenPTVC: 'Giao hàng siêu tốc',
      PhiVanChuyen: Math.round(baseCost * speedMultipliers.super_express + serviceFees.super_express),
      ThoiGianGiaoHang: getRealDeliveryTime('super_express'),
      TocDo: 'super_express',
      estimatedDelivery: calculateEstimatedDelivery('super_express', duration),
      isAvailable: distance <= 30 && isUrbanArea(deliveryAddress) && !isPeakHours(),
      UuDai: ['Xử lý ưu tiên cao nhất', 'Giám sát 24/7'],
      distance: distance,
      duration: duration,
      weight: totalWeight
    }
  ];

  // Lọc chỉ các phương thức khả dụng
  const availableOptions = results.filter(option => option.isAvailable);
  
  console.log(`🎯 Có ${availableOptions.length} phương thức khả dụng`);
  return availableOptions;
};

// 🆕 Hàm tính thời gian giao hàng ước tính
const calculateEstimatedDelivery = (speed, baseDuration) => {
  const now = new Date();
  const speedTimeFactors = {
    'standard': 2.0,
    'fast': 1.3,
    'express': 1.0,
    'super_express': 0.7
  };
  
  const totalMinutes = Math.round(baseDuration * speedTimeFactors[speed]);
  const deliveryTime = new Date(now.getTime() + totalMinutes * 60000);
  
  return deliveryTime.toLocaleString('vi-VN', {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  });
};

// 🆕 Fallback khi API distance fail
const calculateDistanceFallback = async (origin, destination) => {
  console.log('🔄 Using fallback distance calculation');
  
  // Simple estimation based on address similarity
  const isSameProvince = origin.includes('Hồ Chí Minh') && destination.includes('Hồ Chí Minh') ||
                        origin.includes('Hà Nội') && destination.includes('Hà Nội');
  
  if (isSameProvince) {
    return {
      distance: 15,
      duration: 38,
      source: 'fallback_estimation'
    };
  } else {
    return {
      distance: 50,
      duration: 125,
      source: 'fallback_estimation'
    };
  }
};