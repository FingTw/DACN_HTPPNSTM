// controllers/rfqController.js
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";

const models = initModels(sequelize);
const {
  yeucaudathang,
  denghicungcap,
  chitietchapnhan,
  donhang,
  chitiet_donhang,
  taikhoan,
  sanpham,
  cuahang,
  danhmuc,
  hinhanh,
  taikhoan_vaitro,
  vaitro,
} = models;

/* ============================
 📋 1. NGƯỜI MUA - TẠO YÊU CẦU MUA HÀNG
============================ */
export const createBuyerRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // 🛡️ Xác thực JWT
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

    const MaTK_Buyer = decoded.MaTK;

    // 📌 Kiểm tra vai trò Buyer
    const userRole = await taikhoan_vaitro.findOne({
      where: { MaTK: MaTK_Buyer },
      include: [
        {
          model: vaitro,
          as: "vaitro",
          where: { TenVT: { [Op.in]: ["Buyer", "Admin"] } },
        },
      ],
      transaction,
    });

    if (!userRole) {
      return res
        .status(403)
        .json({ message: "Chỉ người mua mới có thể tạo yêu cầu" });
    }

    const {
      MaDM,
      TenSP_YeuCau,
      SoLuongYeuCau,
      ChatLuongYeuCau,
      GiaMongMuon,
      ThoiHan,
    } = req.body;

    // 📌 Validate
    if (!TenSP_YeuCau || !SoLuongYeuCau) {
      return res.status(400).json({
        message: "Vui lòng nhập tên sản phẩm và số lượng cần mua",
      });
    }

    if (SoLuongYeuCau <= 0) {
      return res.status(400).json({
        message: "Số lượng phải lớn hơn 0",
      });
    }

    // 📌 Tạo mã YCDH tự động
    const now = new Date();
    const prefix =
      "YCDH" +
      now.getFullYear().toString().slice(2) +
      String(now.getMonth() + 1).padStart(2, "0");

    const lastRequest = await yeucaudathang.findOne({
      where: { MaYCDH: { [Op.like]: `${prefix}%` } },
      order: [["MaYCDH", "DESC"]],
      transaction,
    });

    let newId = prefix + "0001";
    if (lastRequest) {
      const num = parseInt(lastRequest.MaYCDH.slice(8)) + 1;
      newId = prefix + num.toString().padStart(4, "0");
    }

    // 📌 Tính thời hạn mặc định (3 ngày)
    const defaultDeadline = new Date();
    defaultDeadline.setDate(defaultDeadline.getDate() + 3);

    // 📌 Tạo yêu cầu mua hàng
    const request = await yeucaudathang.create(
      {
        MaYCDH: newId,
        MaTK_Buyer,
        MaDM,
        MaSP: null,
        TenSP_YeuCau,
        SoLuongYeuCau,
        ChatLuongYeuCau,
        GiaMongMuon,
        NgayTao: new Date(),
        ThoiHan: ThoiHan ? new Date(ThoiHan) : defaultDeadline,
        TrangThai: "Open",
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message:
        "Tạo yêu cầu mua hàng thành công! Người bán sẽ nhận được thông báo.",
      data: request,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("🔥 createBuyerRequest:", err);
    return res.status(500).json({
      message: "Lỗi tạo yêu cầu mua hàng",
      error: err.message,
    });
  }
};

/* ============================
 📋 2. NGƯỜI MUA - XEM YÊU CẦU CỦA MÌNH
============================ */
export const getMyRequests = async (req, res) => {
  try {
    // 🛡️ Xác thực JWT
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

    const MaTK_Buyer = decoded.MaTK;
    const { TrangThai, page = 1, limit = 10 } = req.query;

    // 📌 Build where clause
    const whereClause = { MaTK_Buyer };
    if (TrangThai) whereClause.TrangThai = TrangThai;

    const offset = (page - 1) * limit;

    // 📌 Lấy danh sách yêu cầu
    const { rows: requests, count } = await yeucaudathang.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: danhmuc,
          as: "MaDM_danhmuc",
          attributes: ["MaDM", "TenDM"],
        },
        {
          model: denghicungcap,
          as: "denghicungcaps",
          include: [
            {
              model: taikhoan,
              as: "MaTK_Seller_taikhoan",
              attributes: ["MaTK", "HoTen", "Email", "SDT"],
              include: [
                {
                  model: cuahang,
                  as: "cuahangs",
                  attributes: ["MaCH", "TenCH", "DiaChi", "SDT"],
                },
              ],
            },
            {
              model: sanpham,
              as: "MaSP_sanpham",
              attributes: [
                "MaSP",
                "TenSP",
                "MoTa",
                "Gia",
                "SoLuongTonKho",
                "DonViTinh",
              ],
            },
          ],
        },
      ],
      order: [["NgayTao", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // 📌 Tính tiến độ cho từng yêu cầu
    const requestsWithProgress = requests.map((req) => {
      const totalOffered = req.denghicungcaps.reduce(
        (sum, offer) =>
          sum + (offer.TrangThai === "Accepted" ? offer.SoLuongCungCap : 0),
        0
      );
      const pendingOffers = req.denghicungcaps.filter(
        (offer) => offer.TrangThai === "Pending"
      ).length;

      return {
        ...req.toJSON(),
        progress: {
          requested: req.SoLuongYeuCau,
          fulfilled: totalOffered,
          remaining: Math.max(0, req.SoLuongYeuCau - totalOffered),
          pendingOffers,
        },
      };
    });

    return res.json({
      success: true,
      data: requestsWithProgress,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    console.error("🔥 getMyRequests:", err);
    return res.status(500).json({
      message: "Lỗi lấy danh sách yêu cầu",
      error: err.message,
    });
  }
};

/* ============================
 🏪 3. NGƯỜI BÁN - XEM TẤT CẢ YÊU CẦU ĐANG MỞ
============================ */
export const getAllOpenRequests = async (req, res) => {
  try {
    const { MaDM, keyword, page = 1, limit = 10 } = req.query;

    // 📌 Build where clause
    const whereClause = {
      TrangThai: { [Op.in]: ["Open", "PartiallyFilled"] },
      ThoiHan: { [Op.gte]: new Date() },
    };

    if (MaDM) whereClause.MaDM = MaDM;
    if (keyword) {
      whereClause[Op.or] = [
        { TenSP_YeuCau: { [Op.like]: `%${keyword}%` } },
        { ChatLuongYeuCau: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    // 📌 Lấy danh sách yêu cầu
    const { rows: requests, count } = await yeucaudathang.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: taikhoan,
          as: "MaTK_Buyer_taikhoan",
          attributes: ["MaTK", "HoTen", "DiaChi", "SDT"],
        },
        {
          model: danhmuc,
          as: "MaDM_danhmuc",
          attributes: ["MaDM", "TenDM"],
        },
        {
          model: denghicungcap,
          as: "denghicungcaps",
          attributes: ["MaDNCC", "SoLuongCungCap", "GiaDeNghi", "TrangThai"],
        },
      ],
      order: [["NgayTao", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // 📌 Tính số lượng còn thiếu
    const requestsWithRemaining = requests.map((req) => {
      const totalAccepted = req.denghicungcaps.reduce(
        (sum, offer) =>
          sum + (offer.TrangThai === "Accepted" ? offer.SoLuongCungCap : 0),
        0
      );

      return {
        ...req.toJSON(),
        remaining: Math.max(0, req.SoLuongYeuCau - totalAccepted),
      };
    });

    return res.json({
      success: true,
      data: requestsWithRemaining,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    console.error("🔥 getAllOpenRequests:", err);
    return res.status(500).json({
      message: "Lỗi lấy danh sách yêu cầu",
      error: err.message,
    });
  }
};

/* ============================
 🏪 4. NGƯỜI BÁN - GỬI ĐỀ NGHỊ CUNG CẤP
============================ */
export const submitProposal = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // 🛡️ Xác thực JWT
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

    const MaTK_Seller = decoded.MaTK;

    // 📌 Kiểm tra vai trò Seller
    const userRole = await taikhoan_vaitro.findOne({
      where: { MaTK: MaTK_Seller },
      include: [
        {
          model: vaitro,
          as: "vaitro",
          where: { TenVT: { [Op.in]: ["Seller", "Admin"] } },
        },
      ],
      transaction,
    });

    if (!userRole) {
      return res
        .status(403)
        .json({ message: "Chỉ người bán mới có thể gửi đề nghị" });
    }

    const { MaYCDH, MaSP, SoLuongCungCap, GiaDeNghi, ChatLuongDeNghi } =
      req.body;

    // 📌 Validate
    if (!MaYCDH || !MaSP || !SoLuongCungCap || !GiaDeNghi) {
      return res.status(400).json({
        message: "Thiếu thông tin bắt buộc",
      });
    }

    if (SoLuongCungCap <= 0 || GiaDeNghi <= 0) {
      return res.status(400).json({
        message: "Số lượng và giá phải lớn hơn 0",
      });
    }

    // 📌 Kiểm tra yêu cầu còn mở không
    const request = await yeucaudathang.findByPk(MaYCDH, { transaction });
    if (!request) {
      return res.status(404).json({
        message: "Không tìm thấy yêu cầu đặt hàng",
      });
    }

    if (!["Open", "PartiallyFilled"].includes(request.TrangThai)) {
      return res.status(400).json({
        message: "Yêu cầu này đã đóng hoặc đã đủ số lượng",
      });
    }

    if (new Date() > new Date(request.ThoiHan)) {
      return res.status(400).json({
        message: "Yêu cầu này đã hết hạn",
      });
    }

    // 📌 Không thể cung cấp cho yêu cầu của chính mình
    if (request.MaTK_Buyer === MaTK_Seller) {
      return res.status(400).json({
        message: "Không thể cung cấp cho yêu cầu của chính mình",
      });
    }

    // 📌 Kiểm tra sản phẩm thuộc về người bán
    const product = await sanpham.findOne({
      where: { MaSP },
      include: [
        {
          model: cuahang,
          as: "cuahang",
          where: { MaTK: MaTK_Seller },
        },
      ],
      transaction,
    });

    if (!product) {
      return res.status(403).json({
        message: "Sản phẩm không tồn tại hoặc không thuộc về cửa hàng của bạn",
      });
    }

    // 📌 Kiểm tra số lượng tồn kho
    if (product.SoLuongTonKho < SoLuongCungCap) {
      return res.status(400).json({
        message: `Số lượng tồn kho không đủ. Còn lại: ${product.SoLuongTonKho}`,
      });
    }

    // 📌 Tính tổng số lượng đã được chấp nhận
    const acceptedProposals = await denghicungcap.findAll({
      where: { MaYCDH, TrangThai: "Accepted" },
      transaction,
    });

    const totalAccepted = acceptedProposals.reduce(
      (sum, p) => sum + p.SoLuongCungCap,
      0
    );
    const remaining = request.SoLuongYeuCau - totalAccepted;

    if (remaining <= 0) {
      return res.status(400).json({
        message: "Yêu cầu này đã đủ số lượng",
      });
    }

    // 📌 Cảnh báo nếu cung cấp quá nhiều
    if (SoLuongCungCap > remaining) {
      return res.status(400).json({
        message: `Số lượng cung cấp vượt quá số lượng còn thiếu (${remaining})`,
      });
    }

    // 📌 Kiểm tra đã gửi đề nghị chưa
    const existingProposal = await denghicungcap.findOne({
      where: {
        MaYCDH,
        MaTK_Seller,
        MaSP,
        TrangThai: { [Op.in]: ["Pending", "Accepted"] },
      },
      transaction,
    });

    if (existingProposal) {
      return res.status(400).json({
        message: "Bạn đã gửi đề nghị cho sản phẩm này rồi",
      });
    }

    // 📌 Tạo mã DNCC
    const now = new Date();
    const prefix =
      "DNCC" +
      now.getFullYear().toString().slice(2) +
      String(now.getMonth() + 1).padStart(2, "0");

    const lastProposal = await denghicungcap.findOne({
      where: { MaDNCC: { [Op.like]: `${prefix}%` } },
      order: [["MaDNCC", "DESC"]],
      transaction,
    });

    let newId = prefix + "0001";
    if (lastProposal) {
      const num = parseInt(lastProposal.MaDNCC.slice(8)) + 1;
      newId = prefix + num.toString().padStart(4, "0");
    }

    // 📌 Tạo đề nghị cung cấp
    const proposal = await denghicungcap.create(
      {
        MaDNCC: newId,
        MaYCDH,
        MaTK_Seller,
        MaSP,
        SoLuongCungCap,
        GiaDeNghi,
        ChatLuongDeNghi,
        NgayDeNghi: new Date(),
        TrangThai: "Pending",
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Gửi đề nghị cung cấp thành công! Chờ người mua xác nhận.",
      data: {
        ...proposal.toJSON(),
        product: {
          TenSP: product.TenSP,
          SoLuongTonKho: product.SoLuongTonKho,
        },
        remaining,
      },
    });
  } catch (err) {
    await transaction.rollback();
    console.error("🔥 submitProposal:", err);
    return res.status(500).json({
      message: "Lỗi gửi đề nghị cung cấp",
      error: err.message,
    });
  }
};

/* ============================
 📋 5. NGƯỜI MUA - XEM ĐỀ NGHỊ CHO YÊU CẦU
============================ */
export const getProposalsForRequest = async (req, res) => {
  try {
    // 🛡️ Xác thực JWT
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

    const MaTK_Buyer = decoded.MaTK;
    const { MaYCDH } = req.params;

    // 📌 Kiểm tra quyền
    const request = await yeucaudathang.findByPk(MaYCDH);
    if (!request) {
      return res.status(404).json({
        message: "Không tìm thấy yêu cầu",
      });
    }

    if (request.MaTK_Buyer !== MaTK_Buyer && decoded.role !== "Admin") {
      return res.status(403).json({
        message: "Không có quyền xem đề nghị này",
      });
    }

    // 📌 Lấy danh sách đề nghị
    const proposals = await denghicungcap.findAll({
      where: { MaYCDH },
      include: [
        {
          model: taikhoan,
          as: "MaTK_Seller_taikhoan",
          attributes: ["MaTK", "HoTen", "Email", "SDT"],
          include: [
            {
              model: cuahang,
              as: "cuahangs",
              attributes: ["MaCH", "TenCH", "DiaChi", "SDT", "MoTa"],
            },
          ],
        },
        {
          model: sanpham,
          as: "MaSP_sanpham",
          attributes: [
            "MaSP",
            "TenSP",
            "MoTa",
            "Gia",
            "SoLuongTonKho",
            "DonViTinh",
          ],
        },
        {
          model: chitietchapnhan,
          as: "chitietchapnhans",
        },
      ],
      order: [
        ["GiaDeNghi", "ASC"],
        ["NgayDeNghi", "ASC"],
      ],
    });

    // 📌 Tính tổng số lượng đã chấp nhận
    const totalAccepted = proposals.reduce(
      (sum, p) => sum + (p.TrangThai === "Accepted" ? p.SoLuongCungCap : 0),
      0
    );

    return res.json({
      success: true,
      data: {
        request,
        proposals,
        summary: {
          total: proposals.length,
          pending: proposals.filter((p) => p.TrangThai === "Pending").length,
          accepted: proposals.filter((p) => p.TrangThai === "Accepted").length,
          rejected: proposals.filter((p) => p.TrangThai === "Rejected").length,
          progress: {
            requested: request.SoLuongYeuCau,
            fulfilled: totalAccepted,
            remaining: Math.max(0, request.SoLuongYeuCau - totalAccepted),
          },
        },
      },
    });
  } catch (err) {
    console.error("🔥 getProposalsForRequest:", err);
    return res.status(500).json({
      message: "Lỗi lấy danh sách đề nghị",
      error: err.message,
    });
  }
};

/* ============================
 ✅ 6. NGƯỜI MUA - CHẤP NHẬN ĐỀ NGHỊ & TẠO ĐƠN HÀNG
============================ */
export const acceptProposalAndCreateOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // 🛡️ Xác thực JWT
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

    const MaTK_Buyer = decoded.MaTK;
    const { MaDNCC, SoLuongMua, GhiChu } = req.body;

    if (!MaDNCC) {
      return res.status(400).json({
        message: "Thiếu mã đề nghị cung cấp",
      });
    }

    // 📌 Lấy đề nghị với đầy đủ thông tin
    const proposal = await denghicungcap.findByPk(MaDNCC, {
      include: [
        {
          model: yeucaudathang,
          as: "MaYCDH_yeucaudathang",
        },
        {
          model: sanpham,
          as: "MaSP_sanpham",
        },
      ],
      transaction,
    });

    if (!proposal) {
      return res.status(404).json({
        message: "Không tìm thấy đề nghị",
      });
    }

    // 📌 Kiểm tra quyền
    const request = proposal.MaYCDH_yeucaudathang;
    if (request.MaTK_Buyer !== MaTK_Buyer && decoded.role !== "Admin") {
      return res.status(403).json({
        message: "Không có quyền chấp nhận đề nghị này",
      });
    }

    // 📌 Kiểm tra trạng thái đề nghị
    if (proposal.TrangThai !== "Pending") {
      return res.status(400).json({
        message: `Đề nghị này đã ${
          proposal.TrangThai === "Accepted" ? "được chấp nhận" : "bị từ chối"
        }`,
      });
    }

    // 📌 Kiểm tra số lượng
    const quantityToBuy = SoLuongMua || proposal.SoLuongCungCap;
    if (quantityToBuy > proposal.SoLuongCungCap) {
      return res.status(400).json({
        message: "Số lượng mua vượt quá số lượng người bán cung cấp",
      });
    }

    if (quantityToBuy <= 0) {
      return res.status(400).json({
        message: "Số lượng mua phải lớn hơn 0",
      });
    }

    // 📌 Kiểm tra tồn kho
    const product = proposal.MaSP_sanpham;
    if (product.SoLuongTonKho < quantityToBuy) {
      return res.status(400).json({
        message: `Sản phẩm không đủ hàng. Còn lại: ${product.SoLuongTonKho}`,
      });
    }

    // 📌 Tạo mã đơn hàng
    const now = new Date();
    const prefix =
      "DH" +
      now.getFullYear().toString().slice(2) +
      String(now.getMonth() + 1).padStart(2, "0");

    const lastOrder = await donhang.findOne({
      where: { MaDH: { [Op.like]: `${prefix}%` } },
      order: [["MaDH", "DESC"]],
      transaction,
    });

    let newOrderId = prefix + "0001";
    if (lastOrder) {
      const num = parseInt(lastOrder.MaDH.slice(6)) + 1;
      newOrderId = prefix + num.toString().padStart(4, "0");
    }

    const totalAmount = proposal.GiaDeNghi * quantityToBuy;

    // 📌 Tạo đơn hàng
    const order = await donhang.create(
      {
        MaDH: newOrderId,
        MaTK: MaTK_Buyer,
        NgayDatHang: new Date(),
        TongTien: totalAmount,
        TrangThai: "Pending",
        GhiChu: GhiChu || `Đơn từ yêu cầu ${proposal.MaYCDH}`,
      },
      { transaction }
    );

    // 📌 Tạo chi tiết đơn hàng
    await chitiet_donhang.create(
      {
        MaDH: newOrderId,
        MaSP: proposal.MaSP,
        SoLuong: quantityToBuy,
        DonGia: proposal.GiaDeNghi,
        ThanhTien: totalAmount,
      },
      { transaction }
    );

    // 📌 TRỪ SỐ LƯỢNG TỒN KHO
    await product.update(
      {
        SoLuongTonKho: product.SoLuongTonKho - quantityToBuy,
      },
      { transaction }
    );

    // 📌 Cập nhật trạng thái đề nghị
    await proposal.update(
      {
        TrangThai: "Accepted",
      },
      { transaction }
    );

    // 📌 Tạo chi tiết chấp nhận
    const now2 = new Date();
    const prefix2 =
      "CTCN" +
      now2.getFullYear().toString().slice(2) +
      String(now2.getMonth() + 1).padStart(2, "0");

    const lastAcceptance = await chitietchapnhan.findOne({
      where: { MaCTCN: { [Op.like]: `${prefix2}%` } },
      order: [["MaCTCN", "DESC"]],
      transaction,
    });

    let newAcceptanceId = prefix2 + "0001";
    if (lastAcceptance) {
      const num = parseInt(lastAcceptance.MaCTCN.slice(8)) + 1;
      newAcceptanceId = prefix2 + num.toString().padStart(4, "0");
    }

    await chitietchapnhan.create(
      {
        MaCTCN: newAcceptanceId,
        MaDNCC,
        MaDH: newOrderId,
        SoLuongChapNhan: quantityToBuy,
        GiaChapNhan: proposal.GiaDeNghi,
        NgayChapNhan: new Date(),
        GhiChu,
      },
      { transaction }
    );

    // 📌 Cập nhật trạng thái yêu cầu
    const acceptedProposals = await denghicungcap.findAll({
      where: {
        MaYCDH: request.MaYCDH,
        TrangThai: "Accepted",
      },
      transaction,
    });

    const totalAccepted = acceptedProposals.reduce(
      (sum, p) => sum + p.SoLuongCungCap,
      0
    );
    const newStatus =
      totalAccepted >= request.SoLuongYeuCau ? "Completed" : "PartiallyFilled";

    await request.update({ TrangThai: newStatus }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Chấp nhận đề nghị thành công! Đơn hàng đã được tạo.",
      data: {
        order,
        proposal: {
          ...proposal.toJSON(),
          TrangThai: "Accepted",
        },
        product: {
          TenSP: product.TenSP,
          SoLuongConLai: product.SoLuongTonKho - quantityToBuy,
        },
        request: {
          MaYCDH: request.MaYCDH,
          TrangThai: newStatus,
          progress: {
            requested: request.SoLuongYeuCau,
            fulfilled: totalAccepted,
            remaining: Math.max(0, request.SoLuongYeuCau - totalAccepted),
          },
        },
      },
    });
  } catch (err) {
    await transaction.rollback();
    console.error("🔥 acceptProposalAndCreateOrder:", err);
    return res.status(500).json({
      message: "Lỗi chấp nhận đề nghị",
      error: err.message,
    });
  }
};

/* ============================
 ❌ 7. NGƯỜI MUA - TỪ CHỐI ĐỀ NGHỊ
============================ */
export const rejectProposal = async (req, res) => {
  try {
    // 🛡️ Xác thực JWT
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

    const MaTK_Buyer = decoded.MaTK;
    const { MaDNCC } = req.params;
    const { LyDoTuChoi } = req.body;

    // 📌 Lấy đề nghị
    const proposal = await denghicungcap.findByPk(MaDNCC, {
      include: [
        {
          model: yeucaudathang,
          as: "MaYCDH_yeucaudathang",
        },
      ],
    });

    if (!proposal) {
      return res.status(404).json({
        message: "Không tìm thấy đề nghị",
      });
    }

    // 📌 Kiểm tra quyền
    if (
      proposal.MaYCDH_yeucaudathang.MaTK_Buyer !== MaTK_Buyer &&
      decoded.role !== "Admin"
    ) {
      return res.status(403).json({
        message: "Không có quyền từ chối đề nghị này",
      });
    }

    // 📌 Kiểm tra trạng thái
    if (proposal.TrangThai !== "Pending") {
      return res.status(400).json({
        message: "Đề nghị này đã được xử lý",
      });
    }

    // 📌 Cập nhật trạng thái
    await proposal.update({
      TrangThai: "Rejected",
      ChatLuongDeNghi: `${proposal.ChatLuongDeNghi || ""}\n\n[Lý do từ chối]: ${
        LyDoTuChoi || "Không phù hợp"
      }`,
    });

    return res.json({
      success: true,
      message: "Đã từ chối đề nghị",
      data: proposal,
    });
  } catch (err) {
    console.error("🔥 rejectProposal:", err);
    return res.status(500).json({
      message: "Lỗi từ chối đề nghị",
      error: err.message,
    });
  }
};

/* ============================
 🏪 8. NGƯỜI BÁN - XEM ĐỀ NGHỊ CỦA MÌNH
============================ */
export const getMyProposals = async (req, res) => {
  try {
    // 🛡️ Xác thực JWT
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

    const MaTK_Seller = decoded.MaTK;
    const { TrangThai, page = 1, limit = 10 } = req.query;

    // 📌 Build where clause
    const whereClause = { MaTK_Seller };
    if (TrangThai) whereClause.TrangThai = TrangThai;

    const offset = (page - 1) * limit;

    // 📌 Lấy danh sách đề nghị
    const { rows: proposals, count } = await denghicungcap.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: yeucaudathang,
          as: "MaYCDH_yeucaudathang",
          attributes: [
            "MaYCDH",
            "TenSP_YeuCau",
            "SoLuongYeuCau",
            "GiaMongMuon",
            "TrangThai",
          ],
          include: [
            {
              model: taikhoan,
              as: "MaTK_Buyer_taikhoan",
              attributes: ["MaTK", "HoTen", "DiaChi", "SDT"],
            },
          ],
        },
        {
          model: sanpham,
          as: "MaSP_sanpham",
          attributes: ["MaSP", "TenSP", "Gia", "SoLuongTonKho", "DonViTinh"],
        },
        {
          model: chitietchapnhan,
          as: "chitietchapnhans",
          include: [
            {
              model: donhang,
              as: "MaDH_donhang",
              attributes: ["MaDH", "TongTien", "TrangThai"],
            },
          ],
        },
      ],
      order: [["NgayDeNghi", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.json({
      success: true,
      data: proposals,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    console.error("🔥 getMyProposals:", err);
    return res.status(500).json({
      message: "Lỗi lấy danh sách đề nghị",
      error: err.message,
    });
  }
};

/* ============================
 🏪 9. NGƯỜI BÁN - HUỶ ĐỀ NGHỊ
============================ */
export const cancelProposal = async (req, res) => {
  try {
    // 🛡️ Xác thực JWT
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

    const MaTK_Seller = decoded.MaTK;
    const { MaDNCC } = req.params;

    // 📌 Lấy đề nghị
    const proposal = await denghicungcap.findOne({
      where: {
        MaDNCC,
        MaTK_Seller,
      },
    });

    if (!proposal) {
      return res.status(404).json({
        message: "Không tìm thấy đề nghị hoặc đề nghị không thuộc về bạn",
      });
    }

    // 📌 Kiểm tra trạng thái
    if (proposal.TrangThai !== "Pending") {
      return res.status(400).json({
        message: "Không thể hủy đề nghị đã được xử lý",
      });
    }

    // 📌 Cập nhật trạng thái
    await proposal.update({
      TrangThai: "Rejected",
      ChatLuongDeNghi: `${
        proposal.ChatLuongDeNghi || ""
      }\n\n[Người bán đã hủy đề nghị]`,
    });

    return res.json({
      success: true,
      message: "Đã hủy đề nghị thành công",
      data: proposal,
    });
  } catch (err) {
    console.error("🔥 cancelProposal:", err);
    return res.status(500).json({
      message: "Lỗi hủy đề nghị",
      error: err.message,
    });
  }
};

/* ============================
 🏪 10. NGƯỜI BÁN - CẬP NHẬT ĐỀ NGHỊ
============================ */
export const updateProposal = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // 🛡️ Xác thực JWT
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

    const MaTK_Seller = decoded.MaTK;
    const { MaDNCC } = req.params;
    const { SoLuongCungCap, GiaDeNghi, ChatLuongDeNghi } = req.body;

    // 📌 Lấy đề nghị
    const proposal = await denghicungcap.findOne({
      where: {
        MaDNCC,
        MaTK_Seller,
      },
      include: [
        {
          model: sanpham,
          as: "MaSP_sanpham",
        },
        {
          model: yeucaudathang,
          as: "MaYCDH_yeucaudathang",
        },
      ],
      transaction,
    });

    if (!proposal) {
      return res.status(404).json({
        message: "Không tìm thấy đề nghị hoặc đề nghị không thuộc về bạn",
      });
    }

    // 📌 Kiểm tra trạng thái
    if (proposal.TrangThai !== "Pending") {
      return res.status(400).json({
        message: "Không thể cập nhật đề nghị đã được xử lý",
      });
    }

    // 📌 Validate số lượng và giá
    if (SoLuongCungCap && SoLuongCungCap <= 0) {
      return res.status(400).json({
        message: "Số lượng phải lớn hơn 0",
      });
    }

    if (GiaDeNghi && GiaDeNghi <= 0) {
      return res.status(400).json({
        message: "Giá phải lớn hơn 0",
      });
    }

    // 📌 Kiểm tra tồn kho nếu thay đổi số lượng
    if (
      SoLuongCungCap &&
      SoLuongCungCap > proposal.MaSP_sanpham.SoLuongTonKho
    ) {
      return res.status(400).json({
        message: `Số lượng tồn kho không đủ. Còn lại: ${proposal.MaSP_sanpham.SoLuongTonKho}`,
      });
    }

    // 📌 Kiểm tra số lượng không vượt quá yêu cầu
    const request = proposal.MaYCDH_yeucaudathang;
    const acceptedProposals = await denghicungcap.findAll({
      where: {
        MaYCDH: request.MaYCDH,
        TrangThai: "Accepted",
      },
      transaction,
    });

    const totalAccepted = acceptedProposals.reduce(
      (sum, p) => sum + p.SoLuongCungCap,
      0
    );
    const remaining = request.SoLuongYeuCau - totalAccepted;

    if (SoLuongCungCap && SoLuongCungCap > remaining) {
      return res.status(400).json({
        message: `Số lượng vượt quá số lượng còn thiếu (${remaining})`,
      });
    }

    // 📌 Cập nhật đề nghị
    const updateData = {};
    if (SoLuongCungCap) updateData.SoLuongCungCap = SoLuongCungCap;
    if (GiaDeNghi) updateData.GiaDeNghi = GiaDeNghi;
    if (ChatLuongDeNghi !== undefined)
      updateData.ChatLuongDeNghi = ChatLuongDeNghi;

    await proposal.update(updateData, { transaction });

    await transaction.commit();

    return res.json({
      success: true,
      message: "Cập nhật đề nghị thành công",
      data: proposal,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("🔥 updateProposal:", err);
    return res.status(500).json({
      message: "Lỗi cập nhật đề nghị",
      error: err.message,
    });
  }
};

/* ============================
 🔍 11. NGƯỜI BÁN - TÌM SẢN PHẨM CỦA MÌNH ĐỂ ĐỀ NGHỊ
============================ */
export const getMyProductsForProposal = async (req, res) => {
  try {
    // 🛡️ Xác thực JWT
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

    const MaTK_Seller = decoded.MaTK;
    const { keyword, MaDM, page = 1, limit = 20 } = req.query;

    // 📌 Tìm cửa hàng của người bán
    const stores = await cuahang.findAll({
      where: { MaTK: MaTK_Seller },
      attributes: ["MaCH"],
    });

    if (!stores || stores.length === 0) {
      return res.status(404).json({
        message: "Bạn chưa có cửa hàng. Vui lòng tạo cửa hàng trước.",
      });
    }

    const storeIds = stores.map((s) => s.MaCH);

    // 📌 Build where clause
    const whereClause = {
      MaCH: { [Op.in]: storeIds },
      SoLuongTonKho: { [Op.gt]: 0 }, // Chỉ hiển thị SP còn hàng
    };

    if (keyword) {
      whereClause[Op.or] = [
        { TenSP: { [Op.like]: `%${keyword}%` } },
        { MoTa: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    // 📌 Tìm sản phẩm
    const { rows: products, count } = await sanpham.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: cuahang,
          as: "cuahang",
          attributes: ["MaCH", "TenCH"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.json({
      success: true,
      data: products,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    console.error("🔥 getMyProductsForProposal:", err);
    return res.status(500).json({
      message: "Lỗi lấy danh sách sản phẩm",
      error: err.message,
    });
  }
};

/* ============================
 🔔 12. NGƯỜI BÁN - XEM YÊU CẦU MỚI (24H)
============================ */
export const getNewRequestsForSeller = async (req, res) => {
  try {
    // 🛡️ Xác thực JWT (optional cho public endpoint)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        // Token không hợp lệ nhưng vẫn cho xem
      }
    }

    const { MaDM, limit = 10 } = req.query;

    // 📌 Build where clause
    const whereClause = {
      TrangThai: { [Op.in]: ["Open", "PartiallyFilled"] },
      ThoiHan: { [Op.gte]: new Date() },
      NgayTao: {
        [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yêu cầu trong 24h
      },
    };

    if (MaDM) whereClause.MaDM = MaDM;

    // 📌 Lấy yêu cầu mới
    const requests = await yeucaudathang.findAll({
      where: whereClause,
      include: [
        {
          model: taikhoan,
          as: "MaTK_Buyer_taikhoan",
          attributes: ["HoTen", "DiaChi"],
        },
        {
          model: danhmuc,
          as: "MaDM_danhmuc",
          attributes: ["TenDM"],
        },
      ],
      order: [["NgayTao", "DESC"]],
      limit: parseInt(limit),
    });

    return res.json({
      success: true,
      message:
        requests.length > 0
          ? `Có ${requests.length} yêu cầu mới trong 24h`
          : "Không có yêu cầu mới",
      data: requests,
    });
  } catch (err) {
    console.error("🔥 getNewRequestsForSeller:", err);
    return res.status(500).json({
      message: "Lỗi lấy yêu cầu mới",
      error: err.message,
    });
  }
};

/* ============================
 📊 13. THỐNG KÊ CHO NGƯỜI MUA
============================ */
export const getBuyerStatistics = async (req, res) => {
  try {
    // 🛡️ Xác thực JWT
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

    const MaTK_Buyer = decoded.MaTK;

    // 📌 Thống kê yêu cầu
    const allRequests = await yeucaudathang.findAll({
      where: { MaTK_Buyer },
    });

    const stats = {
      totalRequests: allRequests.length,
      openRequests: allRequests.filter((r) => r.TrangThai === "Open").length,
      partiallyFilledRequests: allRequests.filter(
        (r) => r.TrangThai === "PartiallyFilled"
      ).length,
      completedRequests: allRequests.filter((r) => r.TrangThai === "Completed")
        .length,
    };

    // 📌 Thống kê đề nghị
    const allProposals = await denghicungcap.findAll({
      include: [
        {
          model: yeucaudathang,
          as: "MaYCDH_yeucaudathang",
          where: { MaTK_Buyer },
          attributes: [],
        },
      ],
    });

    stats.totalProposalsReceived = allProposals.length;
    stats.pendingProposals = allProposals.filter(
      (p) => p.TrangThai === "Pending"
    ).length;
    stats.acceptedProposals = allProposals.filter(
      (p) => p.TrangThai === "Accepted"
    ).length;

    // 📌 Tổng tiền đã chi
    const acceptances = await chitietchapnhan.findAll({
      include: [
        {
          model: denghicungcap,
          as: "MaDNCC_denghicungcap",
          include: [
            {
              model: yeucaudathang,
              as: "MaYCDH_yeucaudathang",
              where: { MaTK_Buyer },
              attributes: [],
            },
          ],
        },
      ],
    });

    stats.totalSpent = acceptances.reduce(
      (sum, a) => sum + a.SoLuongChapNhan * a.GiaChapNhan,
      0
    );

    return res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    console.error("🔥 getBuyerStatistics:", err);
    return res.status(500).json({
      message: "Lỗi lấy thống kê",
      error: err.message,
    });
  }
};

/* ============================
 📊 14. THỐNG KÊ CHO NGƯỜI BÁN
============================ */
export const getSellerStatistics = async (req, res) => {
  try {
    // 🛡️ Xác thực JWT
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

    const MaTK_Seller = decoded.MaTK;

    // 📌 Thống kê đề nghị
    const allProposals = await denghicungcap.findAll({
      where: { MaTK_Seller },
    });

    const totalProposals = allProposals.length;
    const pendingProposals = allProposals.filter(
      (p) => p.TrangThai === "Pending"
    ).length;
    const acceptedProposals = allProposals.filter(
      (p) => p.TrangThai === "Accepted"
    ).length;
    const rejectedProposals = allProposals.filter(
      (p) => p.TrangThai === "Rejected"
    ).length;

    // 📌 Tính tỷ lệ chấp nhận
    const totalSubmitted = acceptedProposals + rejectedProposals;
    const acceptanceRate =
      totalSubmitted > 0
        ? ((acceptedProposals / totalSubmitted) * 100).toFixed(2)
        : 0;

    // 📌 Doanh thu
    const acceptances = await chitietchapnhan.findAll({
      include: [
        {
          model: denghicungcap,
          as: "MaDNCC_denghicungcap",
          where: { MaTK_Seller },
          attributes: [],
        },
      ],
    });

    const totalRevenue = acceptances.reduce(
      (sum, a) => sum + a.SoLuongChapNhan * a.GiaChapNhan,
      0
    );
    const totalQuantitySold = acceptances.reduce(
      (sum, a) => sum + a.SoLuongChapNhan,
      0
    );

    const stats = {
      totalProposals,
      pendingProposals,
      acceptedProposals,
      rejectedProposals,
      acceptanceRate: `${acceptanceRate}%`,
      totalRevenue,
      totalQuantitySold,
    };

    return res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    console.error("🔥 getSellerStatistics:", err);
    return res.status(500).json({
      message: "Lỗi lấy thống kê",
      error: err.message,
    });
  }
};
