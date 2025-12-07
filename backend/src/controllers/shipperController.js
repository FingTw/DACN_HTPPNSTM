// src/controllers/shipperController.js
import jwt from "jsonwebtoken";
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";
import fs from 'fs';
import path from 'path';
import multer from 'multer';

console.log('🔄 Loading shipper controller...');

const models = initModels(sequelize);
const { donhang, chitiet_donhang, sanpham, taikhoan, lichsu_trangthai, thongbao, giaohang, hinhanh } = models;

// 🟢 TẠO THƯ MỤC UPLOAD (tương thích với code của bạn)
const ensureUploadDir = (type = "delivery_proofs") => {
  const rootDir = process.cwd();
  const uploadDir = path.join(rootDir, "public", "uploads", type);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`✅ Created upload directory: ${uploadDir}`);
  }
  return uploadDir;
};

// 🟢 XỬ LÝ UPLOAD FILE (tương thích với code của bạn)
// 🟢 SỬA TRIỆT ĐỂ HÀM NÀY
const handleFileUpload = (file, type = "delivery_proofs") => {
  const uploadDir = ensureUploadDir(type);

  const fileExt = path.extname(file.originalname).toLowerCase();
  
  // 🟢 SỬA: Tạo tên file KHÔNG bị trùng "delivery_proofs"
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8); // 6 ký tự ngẫu nhiên
  const fileName = `proof_${timestamp}_${randomStr}${fileExt}`;
  
  const filePath = path.join(uploadDir, fileName);

  console.log('📤 File upload details:');
  console.log('  Original name:', file.originalname);
  console.log('  New filename:', fileName);
  console.log('  Upload directory:', uploadDir);
  console.log('  Full path:', filePath);
  console.log('  File size:', file.size, 'bytes');

  try {
    // Write file
    if (file.buffer) {
      fs.writeFileSync(filePath, file.buffer);
      console.log('✅ File written from buffer');
    } else if (file.path && fs.existsSync(file.path)) {
      fs.copyFileSync(file.path, filePath);
      console.log('✅ File copied from temp path');
    } else {
      fs.writeFileSync(filePath, Buffer.from([]));
      console.log('✅ Empty file created');
    }
    
    // Verify file was created
    if (!fs.existsSync(filePath)) {
      throw new Error(`❌ File was not created at: ${filePath}`);
    }
    
    const stats = fs.statSync(filePath);
    console.log(`✅ File verified: ${stats.size} bytes`);
    
    const publicUrl = `/uploads/${type}/${fileName}`;
    
    console.log(`🌐 Public URL: ${publicUrl}`);
    console.log(`🌐 Test URL: http://localhost:3000${publicUrl}`);
    
    return {
      fileName,
      filePath,
      publicUrl,
      fileSize: stats.size,
      mimeType: file.mimetype
    };
    
  } catch (error) {
    console.error('❌ File upload error:', error);
    throw error;
  }
};

export const uploadProofImage = async (req, res) => {
  try {
    const authResult = await checkShipperAuth(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({ 
        success: false,
        message: authResult.error.message 
      });
    }

    console.log('📤 Uploading delivery proof image...');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "Vui lòng chọn ảnh để upload" 
      });
    }

    // Gọi hàm upload - SỬA: KHÔNG truyền type, dùng default
    const uploadResult = handleFileUpload(req.file); // 🟢 CHỈ TRUYỀN FILE
    
    // 🟢 KIỂM TRA FILE TỒN TẠI
    if (!fs.existsSync(uploadResult.filePath)) {
      console.error('❌ File was not created at:', uploadResult.filePath);
      throw new Error('File upload failed - file not created');
    }

    console.log('✅ File exists at:', uploadResult.filePath);
    
    // Tạo mã hình ảnh
    let maHA = null;
    try {
      maHA = await generateMaHA();
      console.log(`🆔 Generated MaHA: ${maHA}`);
      
      if (hinhanh) {
        await hinhanh.create({
          MaHA: maHA,
          DuongDan: uploadResult.publicUrl,
          LoaiAnh: 'DELIVERY_PROOF',
          MoTa: `Ảnh xác nhận giao hàng - ${new Date().toLocaleString('vi-VN')}`,
          NgayTao: new Date()
        });
        console.log('✅ Saved to hinhanh table');
      }
    } catch (hinhAnhError) {
      console.warn('⚠️ Could not save to hinhanh table:', hinhAnhError.message);
    }

    return res.json({
      success: true,
      message: "Upload ảnh thành công",
      data: {
        imageUrl: uploadResult.publicUrl,  // URL đúng
        maHA: maHA,
        fileName: uploadResult.fileName,
        filePath: uploadResult.filePath,
        publicUrl: uploadResult.publicUrl,
        originalName: req.file.originalname,
        size: uploadResult.fileSize,
        mimeType: req.file.mimetype,
        uploadTime: new Date()
      }
    });

  } catch (err) {
    console.error("❌ Lỗi upload ảnh:", err);
    return res.status(500).json({ 
      success: false,
      message: "Lỗi server khi upload ảnh", 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// 🟢 HÀM TẠO MÃ HÌNH ẢNH (tương thích với code của bạn)
const generateMaHA = async () => {
  try {
    const now = new Date();
    const imagePrefix =
      "HA" +
      now.getFullYear().toString().slice(2) +
      String(now.getMonth() + 1).padStart(2, "0");

    // Kiểm tra model hinhanh có tồn tại không
    if (!hinhanh) {
      console.log('⚠️ Model hinhanh không tồn tại, sử dụng timestamp ID');
      return `PROOF_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    const lastImage = await hinhanh.findOne({
      where: { MaHA: { [Op.like]: `${imagePrefix}%` } },
      order: [["MaHA", "DESC"]],
    });

    let newImageId = imagePrefix + "0001";
    if (lastImage) {
      const lastNum = parseInt(lastImage.MaHA.slice(6)) || 0;
      newImageId = imagePrefix + String(lastNum + 1).padStart(4, "0");
    }

    return newImageId;
  } catch (error) {
    console.error('❌ Error generating MaHA:', error);
    // Fallback ID
    return `PROOF_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
};

// 🟢 XÓA ẢNH CŨ KHI CẬP NHẬT
const deleteOldProofImage = async (maGH) => {
  try {
    const delivery = await giaohang.findOne({
      where: { MaGH },
      attributes: ['ProofImage']
    });

    if (delivery && delivery.ProofImage) {
      const oldImagePath = delivery.ProofImage;
      
      // Chỉ xóa nếu là ảnh upload của hệ thống
      if (oldImagePath.includes('/uploads/delivery_proofs/')) {
        const fullPath = path.join(process.cwd(), 'public', oldImagePath);
        
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`🗑️ Đã xóa ảnh cũ: ${oldImagePath}`);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Không thể xóa ảnh cũ:', error.message);
  }
};

// Hàm check shipper auth (giữ nguyên)
const checkShipperAuth = async (req) => {
  try {
    console.log('🔐 Checking shipper auth...');
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith("Bearer ")) {
      return { error: { status: 401, message: "Không có token" } };
    }

    const token = authHeader.split(" ")[1];
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('❌ JWT Verification Error:', jwtError);
      return { error: { status: 401, message: "Token không hợp lệ" } };
    }

    const MaTK = decoded.MaTK;

    const isShipper = 
      (decoded.roles && decoded.roles.includes('Shipper')) || 
      decoded.role === 'Shipper' ||
      decoded.LoaiTK === 'Shipper';

    if (!isShipper) {
      return { error: { status: 403, message: "Bạn không phải shipper" } };
    }

    const user = await taikhoan.findOne({ where: { MaTK } });
    
    if (!user) {
      return { error: { status: 404, message: "Người dùng không tồn tại" } };
    }

    return { success: true, MaTK, user };

  } catch (err) {
    console.error('❌ Auth error:', err);
    return { error: { status: 500, message: "Lỗi xác thực: " + err.message } };
  }
};

// Lấy danh sách đơn hàng cho shipper - ĐÃ SỬA SANG TIẾNG VIỆT
export const getShipperOrders = async (req, res) => {
  console.log('🔄 getShipperOrders called with query:', req.query);
  
  try {
    const authResult = await checkShipperAuth(req);
    
    if (authResult.error) {
      return res.status(authResult.error.status).json({ 
        message: authResult.error.message
      });
    }

    const { MaTK } = authResult;
    const { type = "available" } = req.query;

    console.log(`📦 Fetching ${type} orders for shipper ${MaTK}`);

    if (type === "my_orders") {
      console.log('🔍 Finding delivery records for shipper...');
      
      // Đơn hàng shipper đã nhận - SỬA SANG TIẾNG VIỆT
      const deliveryRecords = await giaohang.findAll({
        where: { 
          MaShipper: MaTK,
          TrangThai: { [Op.in]: ["ĐANG_CHỜ", "ĐANG_GIAO", "ĐÃ_GIAO"] }
        },
        include: [
          {
            model: donhang,
            as: "MaDH_donhang",
            include: [
              {
                model: chitiet_donhang,
                as: "chitiet_donhangs",
                attributes: ["MaSP", "TenSP", "SoLuong", "GiaBan"]
              },
              {
                model: taikhoan,
                as: "MaTK_taikhoan",
                attributes: ["HoTen", "SDT"]
              }
            ]
          }
        ],
        order: [["NgayTao", "DESC"]]
      });

      console.log(`✅ Found ${deliveryRecords.length} delivery records`);

      const ordersWithStatus = deliveryRecords.map(record => {
        if (!record.MaDH_donhang) {
          console.log('❌ Missing order data for delivery record:', record.MaGH);
          return null;
        }
        return {
          ...record.MaDH_donhang.toJSON(),
          deliveryInfo: {
            MaGH: record.MaGH,
            TrangThaiGiaoHang: record.TrangThai,
            ProofImage: record.ProofImage,
            GhiChu: record.GhiChu,
            NgayTaoGiaoHang: record.NgayTao
          },
          isMyOrder: true,
          canAccept: false
        };
      }).filter(order => order !== null);

      console.log(`📊 Returning ${ordersWithStatus.length} orders`);
      
      return res.json({ 
        success: true, 
        data: ordersWithStatus,
        count: ordersWithStatus.length 
      });

    } else {
      console.log('🔍 Finding available orders...');
      
      // Đơn hàng có sẵn - chưa có shipper nhận
      const availableOrders = await donhang.findAll({
        where: {
          TrangThai: "Chờ lấy hàng",
          MaDH: {
            [Op.notIn]: sequelize.literal(`(SELECT MaDH FROM giaohang WHERE TrangThai IN ('ĐANG_CHỜ', 'ĐANG_GIAO'))`)
          }
        },
        include: [
          {
            model: chitiet_donhang,
            as: "chitiet_donhangs",
            attributes: ["MaSP", "TenSP", "SoLuong", "GiaBan"]
          },
          {
            model: taikhoan,
            as: "MaTK_taikhoan",
            attributes: ["HoTen", "SDT"]
          }
        ],
        order: [["NgayTao", "DESC"]]
      });

      console.log(`✅ Found ${availableOrders.length} available orders`);

      const ordersWithStatus = availableOrders.map(order => ({
        ...order.toJSON(),
        isMyOrder: false,
        canAccept: true
      }));

      return res.json({ 
        success: true, 
        data: ordersWithStatus,
        count: availableOrders.length 
      });
    }

  } catch (err) {
    console.error("❌ Lỗi lấy đơn hàng shipper:", err);
    console.error("❌ Error details:", {
      name: err.name,
      message: err.message,
      parent: err.parent?.message
    });
    return res.status(500).json({ 
      message: "Lỗi server khi lấy đơn hàng", 
      error: err.message
    });
  }
};

// Thống kê cho shipper - ĐÃ SỬA SANG TIẾNG VIỆT
// 🟢 SỬA LỖI AMBIGUOUS COLUMN
export const getShipperStats = async (req, res) => {
  console.log('📊 getShipperStats called');
  
  try {
    const authResult = await checkShipperAuth(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({ message: authResult.error.message });
    }

    const { MaTK, user } = authResult;
    console.log(`📊 Calculating stats for shipper ${MaTK}`);

    // Thống kê từ bảng giaohang
    const deliveryRecords = await giaohang.findAll({
      where: { MaShipper: MaTK }
    });

    console.log(`📊 Found ${deliveryRecords.length} delivery records`);

    const stats = {
      total: deliveryRecords.length,
      delivered: deliveryRecords.filter(d => d.TrangThai === 'ĐÃ_GIAO').length,
      delivering: deliveryRecords.filter(d => d.TrangThai === 'ĐANG_GIAO').length,
      pending: deliveryRecords.filter(d => d.TrangThai === 'ĐANG_CHỜ').length,
    };

    console.log('📊 Stats calculated:', stats);

    // Doanh thu tháng - FIXED query
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    console.log(`💰 Calculating revenue for ${currentMonth}/${currentYear}`);

    // 🟢 SỬA: Chỉ định rõ bảng giaohang.NgayTao
    const monthlyDeliveries = await giaohang.findAll({
      where: {
        MaShipper: MaTK,
        TrangThai: 'ĐÃ_GIAO',
        // Sửa: thêm tiền tố bảng giaohang
        [Op.and]: [
          sequelize.where(sequelize.fn('MONTH', sequelize.col('giaohang.NgayTao')), currentMonth),
          sequelize.where(sequelize.fn('YEAR', sequelize.col('giaohang.NgayTao')), currentYear)
        ]
      },
      include: [
        {
          model: donhang,
          as: "MaDH_donhang",
          attributes: ["TongTien", "PhiVanChuyen"]
        }
      ]
    });

    console.log(`💰 Found ${monthlyDeliveries.length} monthly deliveries`);

    const monthlyRevenue = monthlyDeliveries.reduce((total, delivery) => {
      const order = delivery.MaDH_donhang;
      if (!order) {
        console.log('❌ Missing order data for delivery:', delivery.MaGH);
        return total;
      }
      const orderTotal = (parseFloat(order.TongTien) || 0) + (parseFloat(order.PhiVanChuyen) || 0);
      return total + orderTotal;
    }, 0);

    console.log(`💰 Monthly revenue: ${monthlyRevenue}`);

    // Thống kê thông báo - FIXED undefined error
    let unreadNotifications = 0;
    try {
      if (thongbao && typeof thongbao.count === 'function') {
        const notificationCount = await thongbao.count({
          where: { 
            MaShipper: MaTK,
            DaXem: false
          }
        });
        unreadNotifications = notificationCount;
        console.log(`🔔 Unread notifications: ${unreadNotifications}`);
      } else {
        console.log('⚠️ Model thongbao không tồn tại hoặc không có method count');
      }
    } catch (notificationError) {
      console.warn('⚠️ Không thể đếm thông báo:', notificationError.message);
      unreadNotifications = 0;
    }

    const result = {
      stats,
      monthlyRevenue,
      unreadNotifications,
      shipperInfo: {
        MaTK: user.MaTK,
        HoTen: user.HoTen,
        SDT: user.SDT,
        Email: user.Email || '',
        DiaChi: user.DiaChi || '',
        AnhDaiDien: user.AnhDaiDien || ''
      }
    };

    console.log('✅ Final stats result:', result);

    return res.json({
      success: true,
      data: result
    });

  } catch (err) {
    console.error("❌ Lỗi lấy thống kê shipper:", err);
    console.error("❌ Error details:", {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    return res.status(500).json({ 
      message: "Lỗi server khi lấy thống kê", 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Shipper nhận đơn hàng - ĐÃ SỬA SANG TIẾNG VIỆT
export const acceptOrder = async (req, res) => {
  let transaction;
  try {
    const authResult = await checkShipperAuth(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({ message: authResult.error.message });
    }

    const { MaTK, user } = authResult;
    const { MaDH } = req.params;

    transaction = await sequelize.transaction();

    // Kiểm tra đơn hàng có tồn tại và đang chờ lấy hàng không
    const order = await donhang.findOne({ 
      where: { 
        MaDH, 
        TrangThai: "Chờ lấy hàng" 
      },
      transaction 
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ 
        message: "Đơn hàng không tồn tại hoặc không ở trạng thái chờ lấy hàng" 
      });
    }

    // Kiểm tra đơn hàng đã có shipper nhận chưa
    const existingDelivery = await giaohang.findOne({
      where: { 
        MaDH,
        TrangThai: { [Op.in]: ["ĐANG_CHỜ", "ĐANG_GIAO"] }
      },
      transaction
    });

    if (existingDelivery) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: "Đơn hàng đã được shipper khác nhận" 
      });
    }

    // Tạo bản ghi giao hàng mới
    const newDelivery = await giaohang.create({
      MaGH: "GH" + Date.now().toString().substring(8),
      MaShipper: MaTK,
      MaDH: MaDH,
      TrangThai: "ĐANG_CHỜ",
      NgayTao: new Date()
    }, { transaction });

    // Cập nhật trạng thái đơn hàng
    await donhang.update(
      {
        TrangThai: "Đang giao hàng"
      },
      { where: { MaDH }, transaction }
    );

    // Ghi lịch sử trạng thái
    if (lichsu_trangthai) {
      await lichsu_trangthai.create(
        {
          MaLS: "LS" + Date.now().toString().substring(8),
          MaDH: order.MaDH,
          TrangThaiCu: "Chờ lấy hàng",
          TrangThaiMoi: "Đang giao hàng",
          NgayCapNhat: new Date(),
          NguoiCapNhat: MaTK,
          GhiChu: `Shipper ${user.HoTen} nhận đơn`
        },
        { transaction }
      );
    }

    await transaction.commit();

    return res.json({
      success: true,
      message: "Đã nhận đơn hàng thành công",
      data: {
        MaGH: newDelivery.MaGH,
        MaDH: MaDH
      }
    });

  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("❌ Lỗi nhận đơn hàng:", err);
    return res.status(500).json({ 
      message: "Lỗi server", 
      error: err.message 
    });
  }
};

// Shipper xác nhận đã giao hàng 
export const confirmDelivery = async (req, res) => {
  let transaction;
  try {
    const authResult = await checkShipperAuth(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({ 
        success: false,
        message: authResult.error.message 
      });
    }

    const { MaTK, user } = authResult;
    const { MaDH } = req.params;
    const { ProofImage, GhiChu, maHA } = req.body; // Thêm maHA nếu có

    // Validate ảnh bắt buộc
    if (!ProofImage) {
      return res.status(400).json({ 
        success: false,
        message: "Vui lòng upload ảnh xác nhận giao hàng" 
      });
    }

    transaction = await sequelize.transaction();

    // Kiểm tra bản ghi giao hàng
    const deliveryRecord = await giaohang.findOne({ 
      where: { 
        MaDH, 
        MaShipper: MaTK,
        TrangThai: { [Op.in]: ["ĐANG_CHỜ", "ĐANG_GIAO"] }
      },
      include: [
        {
          model: donhang,
          as: "MaDH_donhang",
          attributes: ["MaTK", "TrangThai"]
        }
      ],
      transaction 
    });

    if (!deliveryRecord) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy đơn hàng hoặc bạn không có quyền xác nhận" 
      });
    }

    // Xóa ảnh cũ nếu có (trong trường hợp cập nhật)
    if (deliveryRecord.ProofImage) {
      await deleteOldProofImage(deliveryRecord.MaGH);
    }

    // Cập nhật bản ghi giao hàng
    await giaohang.update(
      {
        TrangThai: "ĐÃ_GIAO",
        ProofImage: ProofImage,
        GhiChu: GhiChu || `Shipper ${user.HoTen} (${user.SDT}) đã giao hàng thành công - ${new Date().toLocaleString('vi-VN')}`,
        MaHA: maHA || null // Lưu mã hình ảnh nếu có
      },
      { where: { MaGH: deliveryRecord.MaGH }, transaction }
    );

    // Cập nhật trạng thái đơn hàng
    await donhang.update(
      {
        TrangThai: "Đã giao hàng",
        NgayGiaoHang: new Date()
      },
      { where: { MaDH }, transaction }
    );

    // Ghi lịch sử trạng thái
    if (lichsu_trangthai) {
      await lichsu_trangthai.create(
        {
          MaLS: "LS" + Date.now().toString().substring(8),
          MaDH: MaDH,
          TrangThaiCu: deliveryRecord.TrangThai,
          TrangThaiMoi: "Đã giao hàng",
          NgayCapNhat: new Date(),
          NguoiCapNhat: MaTK,
          GhiChu: `Shipper ${user.HoTen} xác nhận đã giao hàng${maHA ? ` (Mã ảnh: ${maHA})` : ''}`
        },
        { transaction }
      );
    }

    // Tạo thông báo cho khách hàng
    if (thongbao && deliveryRecord.MaDH_donhang) {
      await thongbao.create({
        MaTB: "TB" + Date.now().toString().substring(8),
        MaTK: deliveryRecord.MaDH_donhang.MaTK,
        MaDH: MaDH,
        NoiDung: `Đơn hàng ${MaDH} đã được shipper ${user.HoTen} (${user.SDT}) giao thành công. Vui lòng kiểm tra và xác nhận đã nhận hàng.`,
        LoaiThongBao: 'DELIVERY_COMPLETED',
        DaXem: false,
        ThoiGian: new Date()
      }, { transaction });
    }

    await transaction.commit();

    return res.json({
      success: true,
      message: "✅ Xác nhận giao hàng thành công!",
      data: {
        MaGH: deliveryRecord.MaGH,
        MaDH: MaDH,
        ProofImage: ProofImage,
        TrangThai: "ĐÃ_GIAO",
        GhiChu: GhiChu,
        deliveryTime: new Date()
      }
    });

  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("❌ Lỗi xác nhận giao hàng:", err);
    return res.status(500).json({ 
      success: false,
      message: "Lỗi server khi xác nhận giao hàng", 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// 🟢 API DUY NHẤT: XÁC NHẬN GIAO HÀNG VỚI ẢNH
export const confirmDeliveryWithImage = async (req, res) => {
  let transaction;
  try {
    const authResult = await checkShipperAuth(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({ 
        success: false,
        message: authResult.error.message 
      });
    }

    const { MaTK, user } = authResult;
    const { MaDH } = req.params;
    
    // 🟢 KIỂM TRA FILE ẢNH (bắt buộc)
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "Vui lòng chụp/chọn ảnh minh chứng giao hàng" 
      });
    }

    const { GhiChu } = req.body;
    
    transaction = await sequelize.transaction();

    // 🟢 KIỂM TRA BẢN GHI GIAO HÀNG
    const deliveryRecord = await giaohang.findOne({ 
      where: { 
        MaDH, 
        MaShipper: MaTK,
        TrangThai: { [Op.in]: ["ĐANG_CHỜ", "ĐANG_GIAO"] }
      },
      include: [
        {
          model: donhang,
          as: "MaDH_donhang",
          attributes: ["MaTK", "TrangThai"]
        }
      ],
      transaction 
    });

    if (!deliveryRecord) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy đơn hàng hoặc bạn không có quyền xác nhận" 
      });
    }

    // 🟢 XÓA ẢNH CŨ NẾU CÓ
    if (deliveryRecord.ProofImage) {
      await deleteOldProofImage(deliveryRecord.MaGH);
    }

    // 🟢 UPLOAD ẢNH MỚI
    const uploadResult = handleFileUpload(req.file, "delivery_proofs");
    
    // 🟢 TẠO MÃ HÌNH ẢNH (nếu cần)
    let maHA = null;
    try {
      if (hinhanh) {
        maHA = await generateMaHA();
        await hinhanh.create({
          MaHA: maHA,
          DuongDan: uploadResult.publicUrl,
          LoaiAnh: 'DELIVERY_PROOF',
          MoTa: `Ảnh xác nhận giao hàng đơn ${MaDH} - ${new Date().toLocaleString('vi-VN')}`,
          NgayTao: new Date()
        }, { transaction });
      }
    } catch (hinhAnhError) {
      console.warn('⚠️ Could not save to hinhanh table:', hinhAnhError.message);
    }

    // 🟢 CẬP NHẬT BẢN GHI GIAO HÀNG
    await giaohang.update(
      {
        TrangThai: "ĐÃ_GIAO",
        ProofImage: uploadResult.publicUrl,
        GhiChu: GhiChu || `Shipper ${user.HoTen} (${user.SDT}) đã giao hàng thành công - ${new Date().toLocaleString('vi-VN')}`,
        MaHA: maHA || null
      },
      { where: { MaGH: deliveryRecord.MaGH }, transaction }
    );

    // 🟢 CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
    await donhang.update(
      {
        TrangThai: "Đã giao hàng",
        NgayGiaoHang: new Date()
      },
      { where: { MaDH }, transaction }
    );

    // 🟢 GHI LỊCH SỬ TRẠNG THÁI
    if (lichsu_trangthai) {
      await lichsu_trangthai.create(
        {
          MaLS: "LS" + Date.now().toString().substring(8),
          MaDH: MaDH,
          TrangThaiCu: deliveryRecord.TrangThai,
          TrangThaiMoi: "Đã giao hàng",
          NgayCapNhat: new Date(),
          NguoiCapNhat: MaTK,
          GhiChu: `Shipper ${user.HoTen} xác nhận đã giao hàng với ảnh minh chứng${maHA ? ` (Mã ảnh: ${maHA})` : ''}`
        },
        { transaction }
      );
    }

    // 🟢 TẠO THÔNG BÁO CHO KHÁCH HÀNG
    if (thongbao && deliveryRecord.MaDH_donhang) {
      await thongbao.create({
        MaTB: "TB" + Date.now().toString().substring(8),
        MaTK: deliveryRecord.MaDH_donhang.MaTK,
        MaDH: MaDH,
        NoiDung: `Đơn hàng ${MaDH} đã được shipper ${user.HoTen} (${user.SDT}) giao thành công. Ảnh xác nhận đã được upload.`,
        LoaiThongBao: 'DELIVERY_COMPLETED',
        DaXem: false,
        ThoiGian: new Date()
      }, { transaction });
    }

    await transaction.commit();

    // 🟢 TRẢ VỀ KẾT QUẢ
    return res.json({
      success: true,
      message: "✅ Xác nhận giao hàng thành công!",
      data: {
        MaGH: deliveryRecord.MaGH,
        MaDH: MaDH,
        ProofImage: uploadResult.publicUrl,
        TrangThai: "ĐÃ_GIAO",
        GhiChu: GhiChu,
        deliveryTime: new Date(),
        imageInfo: {
          url: uploadResult.publicUrl,
          fileName: uploadResult.fileName,
          size: uploadResult.fileSize,
          maHA: maHA
        }
      }
    });

  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("❌ Lỗi xác nhận giao hàng:", err);
    return res.status(500).json({ 
      success: false,
      message: "Lỗi server khi xác nhận giao hàng", 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Các hàm khác giữ nguyên
export const getShipperNotifications = async (req, res) => {
  try {
    const authResult = await checkShipperAuth(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({ message: authResult.error.message });
    }

    const { MaTK } = authResult;

    const notifications = await thongbao.findAll({
      where: { MaShipper: MaTK },
      include: [
        {
          model: donhang,
          as: "MaDH_donhang",
          attributes: ["MaDH", "DCNhanHang", "TongTien", "TrangThai"]
        }
      ],
      order: [["ThoiGian", "DESC"]],
      limit: 20
    });

    return res.json({
      success: true,
      data: notifications
    });

  } catch (err) {
    console.error("❌ Lỗi lấy thông báo:", err);
    return res.status(500).json({ 
      message: "Lỗi server", 
      error: err.message 
    });
  }
};

export const notifyNewOrder = async (req, res) => {
  try {
    const { order, store } = req.body;
    
    console.log('📦 Nhận thông báo đơn hàng mới:', {
      orderId: order.MaDH,
      store: store.TenCH,
      address: order.DCNhanHang
    });

    // Tìm shipper gần nhất
    const nearestShipper = await taikhoan.findOne({
      where: { LoaiTK: 'Shipper' },
      attributes: ['MaTK', 'HoTen']
    });
    
    if (!nearestShipper) {
      return res.json({
        success: false,
        message: 'Không tìm thấy shipper phù hợp'
      });
    }

    // Tạo thông báo trong database
    await thongbao.create({
      MaTB: "TB" + Date.now().toString().substring(8),
      MaShipper: nearestShipper.MaTK,
      MaDH: order.MaDH,
      NoiDung: `Đơn hàng mới từ ${store.TenCH}. Địa chỉ: ${order.DCNhanHang}. Tổng tiền: ${order.TongTien?.toLocaleString('vi-VN')} VND`,
      LoaiThongBao: 'NEW_ORDER',
      DaXem: false,
      ThoiGian: new Date()
    });

    return res.json({
      success: true,
      message: `Đã thông báo đơn hàng cho shipper ${nearestShipper.HoTen}`,
      shipper: {
        MaTK: nearestShipper.MaTK,
        HoTen: nearestShipper.HoTen
      }
    });

  } catch (err) {
    console.error('❌ Lỗi thông báo đơn hàng mới:', err);
    return res.status(500).json({ 
      message: 'Lỗi server', 
      error: err.message 
    });
  }
};
// ==================== 5. Lấy chi tiết đơn hàng cho shipper ====================
export const getOrderDetail = async (req, res) => {
  try {
    const authResult = await checkShipperAuth(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({ message: authResult.error.message });
    }

    const { MaTK } = authResult;
    const { MaDH } = req.params;

    // Kiểm tra xem shipper có quyền xem đơn hàng này không
    const deliveryRecord = await giaohang.findOne({
      where: { 
        MaDH,
        MaShipper: MaTK 
      },
      include: [
        {
          model: donhang,
          as: "MaDH_donhang",
          include: [
            {
              model: chitiet_donhang,
              as: "chitiet_donhangs",
              include: [
                {
                  model: sanpham,
                  as: "MaSP_sanpham",
                  attributes: ["TenSP", "MoTa", "HinhAnh"]
                }
              ]
            },
            {
              model: taikhoan,
              as: "MaTK_taikhoan",
              attributes: ["HoTen", "SDT", "Email", "DiaChi"]
            },
            {
              model: cuahang,
              as: "MaCH_cuahang",
              attributes: ["TenCH", "SDT", "DiaChi", "Email"]
            },
            {
              model: phuongthucvanchuyen,
              as: "MaPTVC_ptvc",
              attributes: ["TenPTVC", "MoTa", "ThoiGianGiaoHang"]
            },
            {
              model: phuongthucthanhtoan,
              as: "MaPTTT_pttt",
              attributes: ["TenPTTT", "MoTa"]
            }
          ]
        }
      ]
    });

    if (!deliveryRecord) {
      // Nếu không có trong giaohang, kiểm tra xem đơn có sẵn để nhận không
      const availableOrder = await donhang.findOne({
        where: { 
          MaDH,
          TrangThai: "Chờ lấy hàng"
        },
        include: [
          {
            model: chitiet_donhang,
            as: "chitiet_donhangs",
            include: [
              {
                model: sanpham,
                as: "MaSP_sanpham",
                attributes: ["TenSP", "MoTa", "HinhAnh"]
              }
            ]
          },
          {
            model: taikhoan,
            as: "MaTK_taikhoan",
            attributes: ["HoTen", "SDT", "Email", "DiaChi"]
          },
          {
            model: cuahang,
            as: "MaCH_cuahang",
            attributes: ["TenCH", "SDT", "DiaChi", "Email"]
          }
        ]
      });

      if (!availableOrder) {
        return res.status(404).json({ 
          message: "Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn hàng này" 
        });
      }

      return res.json({
        success: true,
        data: {
          order: availableOrder.toJSON(),
          canAccept: true,
          isMyOrder: false
        }
      });
    }

    return res.json({
      success: true,
      data: {
        order: deliveryRecord.MaDH_donhang.toJSON(),
        deliveryInfo: {
          MaGH: deliveryRecord.MaGH,
          TrangThaiGiaoHang: deliveryRecord.TrangThai,
          ProofImage: deliveryRecord.ProofImage,
          GhiChu: deliveryRecord.GhiChu,
          NgayTaoGiaoHang: deliveryRecord.NgayTao
        },
        canAccept: false,
        isMyOrder: true
      }
    });

  } catch (err) {
    console.error("❌ Lỗi lấy chi tiết đơn hàng:", err);
    return res.status(500).json({ 
      message: "Lỗi server khi lấy chi tiết đơn hàng", 
      error: err.message 
    });
  }
};

// ==================== 6. Shipper hủy nhận đơn ====================
export const cancelDelivery = async (req, res) => {
  let transaction;
  try {
    const authResult = await checkShipperAuth(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({ message: authResult.error.message });
    }

    const { MaTK, user } = authResult;
    const { MaDH } = req.params;
    const { LyDo } = req.body;

    transaction = await sequelize.transaction();

    // Kiểm tra bản ghi giao hàng
    const deliveryRecord = await giaohang.findOne({ 
      where: { 
        MaDH, 
        MaShipper: MaTK,
        TrangThai: "ĐANG_GIAO"
      },
      transaction 
    });

    if (!deliveryRecord) {
      await transaction.rollback();
      return res.status(404).json({ 
        message: "Không tìm thấy đơn hàng hoặc đơn hàng không ở trạng thái đang giao" 
      });
    }

    // Cập nhật bản ghi giao hàng
    await giaohang.update(
      {
        TrangThai: "ĐÃ_HỦY",
        GhiChu: LyDo || `Shipper ${user.HoTen} đã hủy giao hàng`
      },
      { where: { MaGH: deliveryRecord.MaGH }, transaction }
    );

    // Cập nhật trạng thái đơn hàng về "Chờ lấy hàng" để shipper khác có thể nhận
    await donhang.update(
      {
        TrangThai: "Chờ lấy hàng",
        MaShipper: null
      },
      { where: { MaDH }, transaction }
    );

    // Ghi lịch sử trạng thái
    if (lichsu_trangthai) {
      await lichsu_trangthai.create(
        {
          MaLS: "LS" + Date.now().toString().substring(8),
          MaDH: MaDH,
          TrangThaiCu: "Đang giao hàng",
          TrangThaiMoi: "Chờ lấy hàng",
          NgayCapNhat: new Date(),
          NguoiCapNhat: MaTK,
          GhiChu: `Shipper ${user.HoTen} đã hủy giao hàng: ${LyDo || 'Không có lý do'}`
        },
        { transaction }
      );
    }

    // Tạo thông báo cho khách hàng
    if (thongbao) {
      await thongbao.create({
        MaTB: "TB" + Date.now().toString().substring(8),
        MaTK: deliveryRecord.MaDH_donhang?.MaTK,
        MaDH: MaDH,
        NoiDung: `Shipper ${user.HoTen} đã hủy giao đơn hàng ${MaDH}. Lý do: ${LyDo || 'Không có lý do'}. Đơn hàng đang chờ shipper khác nhận.`,
        LoaiThongBao: 'DELIVERY_CANCELLED',
        DaXem: false,
        ThoiGian: new Date()
      }, { transaction });
    }

    await transaction.commit();

    return res.json({
      success: true,
      message: "Đã hủy giao hàng thành công",
      data: {
        MaGH: deliveryRecord.MaGH,
        MaDH: MaDH
      }
    });

  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("❌ Lỗi hủy giao hàng:", err);
    return res.status(500).json({ 
      message: "Lỗi server", 
      error: err.message 
    });
  }
};

// ==================== 7. Lấy thông tin cá nhân của shipper ====================
export const getShipperProfile = async (req, res) => {
  try {
    const authResult = await checkShipperAuth(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({ message: authResult.error.message });
    }

    const { user } = authResult;

    return res.json({
      success: true,
      data: {
        MaTK: user.MaTK,
        HoTen: user.HoTen,
        SDT: user.SDT,
        Email: user.Email,
        DiaChi: user.DiaChi,
        AnhDaiDien: user.AnhDaiDien,
        NgayTao: user.NgayTao,
        NgaySinh: user.NgaySinh,
        GioiTinh: user.GioiTinh
      }
    });

  } catch (err) {
    console.error("❌ Lỗi lấy thông tin shipper:", err);
    return res.status(500).json({ 
      message: "Lỗi server khi lấy thông tin shipper", 
      error: err.message 
    });
  }
};

// ==================== 8. Cập nhật thông tin shipper ====================
export const updateShipperProfile = async (req, res) => {
  let transaction;
  try {
    const authResult = await checkShipperAuth(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({ message: authResult.error.message });
    }

    const { MaTK } = authResult;
    const { HoTen, SDT, Email, DiaChi, AnhDaiDien, NgaySinh, GioiTinh } = req.body;

    transaction = await sequelize.transaction();

    // Cập nhật thông tin shipper
    await taikhoan.update(
      {
        HoTen,
        SDT,
        Email,
        DiaChi,
        AnhDaiDien,
        NgaySinh,
        GioiTinh,
        NgayCapNhat: new Date()
      },
      { 
        where: { MaTK },
        transaction 
      }
    );

    // Lấy thông tin mới
    const updatedUser = await taikhoan.findOne({ 
      where: { MaTK },
      transaction 
    });

    await transaction.commit();

    return res.json({
      success: true,
      message: "Cập nhật thông tin thành công",
      data: updatedUser
    });

  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("❌ Lỗi cập nhật thông tin shipper:", err);
    return res.status(500).json({ 
      message: "Lỗi server khi cập nhật thông tin", 
      error: err.message 
    });
  }
};

// ==================== 9. Lấy thống kê chi tiết theo tháng ====================
export const getMonthlyStats = async (req, res) => {
  try {
    const authResult = await checkShipperAuth(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({ message: authResult.error.message });
    }

    const { MaTK } = authResult;
    const { year = new Date().getFullYear(), month } = req.query;

    let whereCondition = {
      MaShipper: MaTK,
      TrangThai: 'ĐÃ_GIAO'
    };

    if (month) {
      // Thống kê theo tháng cụ thể
      whereCondition['$giaohang.NgayTao$'] = {
        [Op.and]: [
          sequelize.where(sequelize.fn('MONTH', sequelize.col('giaohang.NgayTao')), month),
          sequelize.where(sequelize.fn('YEAR', sequelize.col('giaohang.NgayTao')), year)
        ]
      };
    } else {
      // Thống kê theo năm (tất cả các tháng trong năm)
      whereCondition['$giaohang.NgayTao$'] = {
        [Op.and]: [
          sequelize.where(sequelize.fn('YEAR', sequelize.col('giaohang.NgayTao')), year)
        ]
      };
    }

    const deliveries = await giaohang.findAll({
      where: whereCondition,
      include: [
        {
          model: donhang,
          as: "MaDH_donhang",
          attributes: ["TongTien", "PhiVanChuyen", "NgayTao"]
        }
      ],
      order: [["NgayTao", "ASC"]]
    });

    // Nhóm theo tháng
    const monthlyData = {};
    deliveries.forEach(delivery => {
      const deliveryDate = new Date(delivery.NgayTao);
      const monthKey = `${deliveryDate.getFullYear()}-${String(deliveryDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          totalOrders: 0,
          totalRevenue: 0,
          deliveries: []
        };
      }
      
      const order = delivery.MaDH_donhang;
      const revenue = (parseFloat(order?.TongTien) || 0) + (parseFloat(order?.PhiVanChuyen) || 0);
      
      monthlyData[monthKey].totalOrders++;
      monthlyData[monthKey].totalRevenue += revenue;
      monthlyData[monthKey].deliveries.push({
        MaGH: delivery.MaGH,
        MaDH: delivery.MaDH,
        revenue: revenue,
        date: delivery.NgayTao
      });
    });

    // Chuyển đổi thành mảng
    const monthlyStats = Object.values(monthlyData);

    return res.json({
      success: true,
      data: {
        year: parseInt(year),
        monthlyStats,
        totalForPeriod: {
          totalOrders: deliveries.length,
          totalRevenue: deliveries.reduce((total, delivery) => {
            const order = delivery.MaDH_donhang;
            return total + (parseFloat(order?.TongTien) || 0) + (parseFloat(order?.PhiVanChuyen) || 0);
          }, 0)
        }
      }
    });

  } catch (err) {
    console.error("❌ Lỗi lấy thống kê theo tháng:", err);
    return res.status(500).json({ 
      message: "Lỗi server khi lấy thống kê", 
      error: err.message 
    });
  }
};

// ==================== 10. Tìm kiếm đơn hàng ====================
export const searchOrders = async (req, res) => {
  try {
    const authResult = await checkShipperAuth(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({ message: authResult.error.message });
    }

    const { MaTK } = authResult;
    const { keyword, status, startDate, endDate } = req.query;

    let whereCondition = { MaShipper: MaTK };

    // Thêm điều kiện tìm kiếm theo từ khóa
    if (keyword) {
      whereCondition[Op.or] = [
        { MaGH: { [Op.like]: `%${keyword}%` } },
        { MaDH: { [Op.like]: `%${keyword}%` } },
        sequelize.literal(`EXISTS (
          SELECT 1 FROM donhang d 
          WHERE d.MaDH = giaohang.MaDH 
          AND (d.MaDH LIKE '%${keyword}%' OR d.DCNhanHang LIKE '%${keyword}%')
        )`)
      ];
    }

    // Thêm điều kiện theo trạng thái
    if (status && status !== 'Tất cả') {
      whereCondition.TrangThai = status;
    }

    // Thêm điều kiện theo thời gian
    if (startDate || endDate) {
      whereCondition.NgayTao = {};
      if (startDate) {
        whereCondition.NgayTao[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereCondition.NgayTao[Op.lte] = new Date(endDate);
      }
    }

    const deliveries = await giaohang.findAll({
      where: whereCondition,
      include: [
        {
          model: donhang,
          as: "MaDH_donhang",
          include: [
            {
              model: taikhoan,
              as: "MaTK_taikhoan",
              attributes: ["HoTen", "SDT"]
            }
          ]
        }
      ],
      order: [["NgayTao", "DESC"]]
    });

    return res.json({
      success: true,
      data: deliveries.map(delivery => ({
        ...delivery.toJSON(),
        order: delivery.MaDH_donhang
      })),
      count: deliveries.length
    });

  } catch (err) {
    console.error("❌ Lỗi tìm kiếm đơn hàng:", err);
    return res.status(500).json({ 
      message: "Lỗi server khi tìm kiếm đơn hàng", 
      error: err.message 
    });
  }
};