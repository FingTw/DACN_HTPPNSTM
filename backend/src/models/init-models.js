// models/init-models.js
import { DataTypes } from "sequelize";
import _chitiet_donhang from "./chitiet_donhang.js";
import _chitietchapnhan from "./chitietchapnhan.js";
import _chucvu from "./chucvu.js";
import _cuahang from "./cuahang.js";
import _danhmuc from "./danhmuc.js";
import _denghicungcap from "./denghicungcap.js";
import _donhang from "./donhang.js";
import _hdbanhang from "./hdbanhang.js";
import _hinhanh from "./hinhanh.js";
import _kho from "./kho.js";
import _nhanvien from "./nhanvien.js";
import _phongban from "./phongban.js";
import _pttt from "./pttt.js";
import _ptvc from "./ptvc.js";
import _taikhoan from "./taikhoan.js";
import _taikhoan_vaitro from "./taikhoan_vaitro.js";
import _vaitro from "./vaitro.js";
import _password_reset_token from "./password_reset_token.js";
import _sanpham from "./sanpham.js";
import _sanpham_danhmuc from "./sanpham_danhmuc.js";
import _sanpham_hinhanh from "./sanpham_hinhanh.js";
import _xuatnhapton from "./xuatnhapton.js";
import _xuatnhapton_sanpham from "./xuatnhapton_sanpham.js";
import _yeucaudathang from "./yeucaudathang.js";
import _giohang from "./giohang.js";
import _ctgh from "./ctgh.js";
import _lichsu_trangthai from "./lichsu_trangthai.js";
import _giaohang from "./giaohang.js";
import _thanhtoan from "./thanhtoan.js";
import _khuyenmai from "./khuyenmai.js";
import _khuyenmai_taikhoan from "./khuyenmai_taikhoan.js";
import _donhang_khuyenmai from "./donhang_khuyenmai.js";
import _danhgiasanpham from "./danhgiasanpham.js"; // 🆕 THÊM MODEL ĐÁNH GIÁ SẢN PHẨM
import _danhgiacuahang from "./danhgiacuahang.js"; // 🆕 THÊM MODEL ĐÁNH GIÁ CỬA HÀNG

function initModels(sequelize) {
  // 🟢 KHAI BÁO CÁC MODEL
  var chitiet_donhang = _chitiet_donhang(sequelize, DataTypes);
  var chitietchapnhan = _chitietchapnhan(sequelize, DataTypes);
  var chucvu = _chucvu(sequelize, DataTypes);
  var cuahang = _cuahang(sequelize, DataTypes);
  var danhmuc = _danhmuc(sequelize, DataTypes);
  var denghicungcap = _denghicungcap(sequelize, DataTypes);
  var donhang = _donhang(sequelize, DataTypes);
  var hdbanhang = _hdbanhang(sequelize, DataTypes);
  var hinhanh = _hinhanh(sequelize, DataTypes);
  var kho = _kho(sequelize, DataTypes);
  var nhanvien = _nhanvien(sequelize, DataTypes);
  var phongban = _phongban(sequelize, DataTypes);
  var pttt = _pttt(sequelize, DataTypes);
  var ptvc = _ptvc(sequelize, DataTypes);
  var sanpham = _sanpham(sequelize, DataTypes);
  var sanpham_danhmuc = _sanpham_danhmuc(sequelize, DataTypes);
  var sanpham_hinhanh = _sanpham_hinhanh(sequelize, DataTypes);
  var taikhoan = _taikhoan(sequelize, DataTypes);
  var xuatnhapton = _xuatnhapton(sequelize, DataTypes);
  var xuatnhapton_sanpham = _xuatnhapton_sanpham(sequelize, DataTypes);
  var yeucaudathang = _yeucaudathang(sequelize, DataTypes);
  var vaitro = _vaitro(sequelize, DataTypes);
  var taikhoan_vaitro = _taikhoan_vaitro(sequelize, DataTypes);
  var password_reset_token = _password_reset_token(sequelize, DataTypes);
  var giohang = _giohang(sequelize, DataTypes);
  var ctgh = _ctgh(sequelize, DataTypes);
  var giaohang = _giaohang(sequelize, DataTypes);
  var thanhtoan = _thanhtoan(sequelize, DataTypes);
  var khuyenmai = _khuyenmai(sequelize, DataTypes);
  var donhang_khuyenmai = _donhang_khuyenmai(sequelize, DataTypes);
  var khuyenmai_taikhoan = _khuyenmai_taikhoan(sequelize, DataTypes);
  var lichsu_trangthai = _lichsu_trangthai(sequelize, DataTypes);
  var danhgiasanpham = _danhgiasanpham(sequelize, DataTypes); // 🆕 MODEL ĐÁNH GIÁ SẢN PHẨM
  var danhgiacuahang = _danhgiacuahang(sequelize, DataTypes); // 🆕 MODEL ĐÁNH GIÁ CỬA HÀNG

  // 🟢 THIẾT LẬP QUAN HỆ GIỮA CÁC BẢNG

  // ======================================
  // 🔄 QUAN HỆ MANY-TO-MANY
  // ======================================
  danhmuc.belongsToMany(sanpham, {
    as: "MaSP_sanpham_sanpham_danhmucs",
    through: sanpham_danhmuc,
    foreignKey: "MaDM",
    otherKey: "MaSP",
  });

  donhang.belongsToMany(sanpham, {
    as: "MaSP_sanphams",
    through: chitiet_donhang,
    foreignKey: "MaDH",
    otherKey: "MaSP",
  });

  hinhanh.belongsToMany(sanpham, {
    as: "sanphams", // ← ĐỔI THÀNH: sanphams
    through: sanpham_hinhanh,
    foreignKey: "MaHA",
    otherKey: "MaSP",
  });

  sanpham.belongsToMany(danhmuc, {
    as: "MaDM_danhmucs",
    through: sanpham_danhmuc,
    foreignKey: "MaSP",
    otherKey: "MaDM",
  });

  sanpham.belongsToMany(donhang, {
    as: "MaDH_donhangs",
    through: chitiet_donhang,
    foreignKey: "MaSP",
    otherKey: "MaDH",
  });

  sanpham.belongsToMany(hinhanh, {
    as: "hinhanhs", // ← ĐỔI THÀNH: hinhanhs (ngắn gọn)
    through: sanpham_hinhanh,
    foreignKey: "MaSP",
    otherKey: "MaHA",
  });

  sanpham.belongsToMany(xuatnhapton, {
    as: "MaXNT_xuatnhaptons",
    through: xuatnhapton_sanpham,
    foreignKey: "MaSP",
    otherKey: "MaXNT",
  });

  xuatnhapton.belongsToMany(sanpham, {
    as: "MaSP_sanpham_xuatnhapton_sanphams",
    through: xuatnhapton_sanpham,
    foreignKey: "MaXNT",
    otherKey: "MaSP",
  });

  taikhoan.hasMany(taikhoan_vaitro, {
    as: "taikhoan_vaitros",
    foreignKey: "MaTK",
  });
  taikhoan_vaitro.belongsTo(taikhoan, { as: "taikhoan", foreignKey: "MaTK" });
  vaitro.hasMany(taikhoan_vaitro, {
    as: "taikhoan_vaitros",
    foreignKey: "MaVT",
  });
  taikhoan_vaitro.belongsTo(vaitro, { as: "vaitro", foreignKey: "MaVT" });
  // ======================================
  // 🔗 QUAN HỆ ONE-TO-MANY & MANY-TO-ONE
  // ======================================

  // 🏪 QUAN HỆ CỬA HÀNG
  sanpham.belongsTo(cuahang, {
    as: "cuahang",
    foreignKey: "MaCH",
  });
  cuahang.hasMany(sanpham, {
    as: "sanphams",
    foreignKey: "MaCH",
  });

  cuahang.belongsTo(taikhoan, {
    as: "MaTK_taikhoan",
    foreignKey: "MaTK",
  });
  taikhoan.hasMany(cuahang, {
    as: "cuahangs",
    foreignKey: "MaTK",
  });

  cuahang.belongsTo(hinhanh, {
    as: "MaHA_CuaHang_hinhanh",
    foreignKey: "MaHA_CuaHang",
  });
  hinhanh.hasMany(cuahang, {
    as: "cuahangs",
    foreignKey: "MaHA_CuaHang",
  });

  // 📦 QUAN HỆ SẢN PHẨM
  sanpham_danhmuc.belongsTo(sanpham, {
    as: "MaSP_sanpham",
    foreignKey: "MaSP",
  });
  sanpham.hasMany(sanpham_danhmuc, {
    as: "sanpham_danhmucs",
    foreignKey: "MaSP",
  });

  sanpham_danhmuc.belongsTo(danhmuc, {
    as: "MaDM_danhmuc",
    foreignKey: "MaDM",
  });
  danhmuc.hasMany(sanpham_danhmuc, {
    as: "sanpham_danhmucs",
    foreignKey: "MaDM",
  });

  sanpham_hinhanh.belongsTo(sanpham, {
    as: "MaSP_sanpham",
    foreignKey: "MaSP",
  });
  sanpham.hasMany(sanpham_hinhanh, {
    as: "sanpham_hinhanhs",
    foreignKey: "MaSP",
  });

  sanpham_hinhanh.belongsTo(hinhanh, {
    as: "MaHA_hinhanh",
    foreignKey: "MaHA",
  });
  hinhanh.hasMany(sanpham_hinhanh, {
    as: "sanpham_hinhanhs",
    foreignKey: "MaHA",
  });

  // 🧾 QUAN HỆ ĐƠN HÀNG
  chitiet_donhang.belongsTo(donhang, {
    as: "MaDH_donhang",
    foreignKey: "MaDH",
  });
  donhang.hasMany(chitiet_donhang, {
    as: "chitiet_donhangs",
    foreignKey: "MaDH",
  });

  chitiet_donhang.belongsTo(sanpham, {
    as: "MaSP_sanpham",
    foreignKey: "MaSP",
  });
  sanpham.hasMany(chitiet_donhang, {
    as: "chitiet_donhangs",
    foreignKey: "MaSP",
  });

  donhang.belongsTo(taikhoan, {
    as: "MaTK_taikhoan",
    foreignKey: "MaTK",
  });
  taikhoan.hasMany(donhang, {
    as: "donhangs",
    foreignKey: "MaTK",
  });

  donhang.belongsTo(pttt, {
    as: "MaPTTT_pttt",
    foreignKey: "MaPTTT",
  });
  pttt.hasMany(donhang, {
    as: "donhangs",
    foreignKey: "MaPTTT",
  });

  donhang.belongsTo(ptvc, {
    as: "MaPTVC_ptvc",
    foreignKey: "MaPTVC",
  });
  ptvc.hasMany(donhang, {
    as: "donhangs",
    foreignKey: "MaPTVC",
  });

  // 👤 QUAN HỆ TÀI KHOẢN
  taikhoan.belongsTo(hinhanh, {
    as: "MaHA_Avatar_hinhanh",
    foreignKey: "MaHA_Avatar",
  });
  hinhanh.hasMany(taikhoan, {
    as: "taikhoans",
    foreignKey: "MaHA_Avatar",
  });

  password_reset_token.belongsTo(taikhoan, {
    as: "MaTK_taikhoan",
    foreignKey: "MaTK",
  });
  taikhoan.hasMany(password_reset_token, {
    as: "password_reset_tokens",
    foreignKey: "MaTK",
  });

  // 🛒 QUAN HỆ GIỎ HÀNG
  giohang.belongsTo(taikhoan, {
    as: "MaTK_taikhoan",
    foreignKey: "MaTK",
  });
  taikhoan.hasMany(giohang, {
    as: "giohangs",
    foreignKey: "MaTK",
  });

  ctgh.belongsTo(giohang, {
    as: "MaGH_giohang",
    foreignKey: "MaGH",
  });
  giohang.hasMany(ctgh, {
    as: "ctghs",
    foreignKey: "MaGH",
  });

  ctgh.belongsTo(sanpham, {
    as: "MaSP_sanpham",
    foreignKey: "MaSP",
  });
  sanpham.hasMany(ctgh, {
    as: "ctghs",
    foreignKey: "MaSP",
  });

  // 📋 QUAN HỆ LỊCH SỬ TRẠNG THÁI
  lichsu_trangthai.belongsTo(donhang, {
    as: "MaDH_donhang",
    foreignKey: "MaDH",
  });
  donhang.hasMany(lichsu_trangthai, {
    as: "lichsu_trangthais",
    foreignKey: "MaDH",
  });

  lichsu_trangthai.belongsTo(taikhoan, {
    as: "NguoiCapNhat_taikhoan",
    foreignKey: "NguoiCapNhat",
  });
  taikhoan.hasMany(lichsu_trangthai, {
    as: "lichsu_trangthais",
    foreignKey: "NguoiCapNhat",
  });

  // ======================================
  // ⭐ QUAN HỆ ĐÁNH GIÁ MỚI
  // ======================================

  // 🟢 ĐÁNH GIÁ SẢN PHẨM
  danhgiasanpham.belongsTo(sanpham, {
    as: "sanpham", // ← số ít, rõ ràng
    foreignKey: "MaSP",
  });
  sanpham.hasMany(danhgiasanpham, {
    as: "danhgias", // ← ĐỔI THÀNH: danhgias (số nhiều)
    foreignKey: "MaSP",
  });

  danhgiasanpham.belongsTo(taikhoan, {
    as: "nguoidanhgia",
    foreignKey: "MaTK",
  });
  taikhoan.hasMany(danhgiasanpham, {
    as: "danhgias_sanpham",
    foreignKey: "MaTK",
  });

  // 🟢 ĐÁNH GIÁ CỬA HÀNG
  danhgiacuahang.belongsTo(cuahang, {
    as: "MaCH_cuahang",
    foreignKey: "MaCH",
  });
  cuahang.hasMany(danhgiacuahang, {
    as: "danhgia",
    foreignKey: "MaCH",
  });

  danhgiacuahang.belongsTo(taikhoan, {
    as: "MaTK_taikhoan",
    foreignKey: "MaTK",
  });
  taikhoan.hasMany(danhgiacuahang, {
    as: "danhgia_cuahang",
    foreignKey: "MaTK",
  });

  // ======================================
  // 🔄 CÁC QUAN HỆ KHÁC
  // ======================================

  // Nhân viên & Chức vụ
  nhanvien.belongsTo(chucvu, {
    as: "MaCV_chucvu",
    foreignKey: "MaCV",
  });
  chucvu.hasMany(nhanvien, {
    as: "nhanviens",
    foreignKey: "MaCV",
  });

  // Nhân viên & Phòng ban
  nhanvien.belongsTo(phongban, {
    as: "MaPB_phongban",
    foreignKey: "MaPB",
  });
  phongban.hasMany(nhanvien, {
    as: "nhanviens",
    foreignKey: "MaPB",
  });

  // Nhân viên & Hình ảnh
  nhanvien.belongsTo(hinhanh, {
    as: "MaHA_Avatar_hinhanh",
    foreignKey: "MaHA_Avatar",
  });
  hinhanh.hasMany(nhanvien, {
    as: "nhanviens",
    foreignKey: "MaHA_Avatar",
  });

  // Danh mục & Hình ảnh
  danhmuc.belongsTo(hinhanh, {
    as: "MaHA_DanhMuc_hinhanh",
    foreignKey: "MaHA_DanhMuc",
  });
  hinhanh.hasMany(danhmuc, {
    as: "danhmucs",
    foreignKey: "MaHA_DanhMuc",
  });

  // Xuất nhập tồn
  xuatnhapton.belongsTo(kho, {
    as: "MaKho_kho",
    foreignKey: "MaKho",
  });
  kho.hasMany(xuatnhapton, {
    as: "xuatnhaptons",
    foreignKey: "MaKho",
  });

  xuatnhapton.belongsTo(nhanvien, {
    as: "MaNV_nhanvien",
    foreignKey: "MaNV",
  });
  nhanvien.hasMany(xuatnhapton, {
    as: "xuatnhaptons",
    foreignKey: "MaNV",
  });

  xuatnhapton_sanpham.belongsTo(xuatnhapton, {
    as: "MaXNT_xuatnhapton",
    foreignKey: "MaXNT",
  });
  xuatnhapton.hasMany(xuatnhapton_sanpham, {
    as: "xuatnhapton_sanphams",
    foreignKey: "MaXNT",
  });

  xuatnhapton_sanpham.belongsTo(sanpham, {
    as: "MaSP_sanpham",
    foreignKey: "MaSP",
  });
  sanpham.hasMany(xuatnhapton_sanpham, {
    as: "xuatnhapton_sanphams",
    foreignKey: "MaSP",
  });

  // Hợp đồng bán hàng
  hdbanhang.belongsTo(taikhoan, {
    as: "MaTK_taikhoan",
    foreignKey: "MaTK",
  });
  taikhoan.hasMany(hdbanhang, {
    as: "hdbanhangs",
    foreignKey: "MaTK",
  });

  // Cửa hàng - Hợp đồng (nếu có quan hệ)
  cuahang.belongsTo(hdbanhang, {
    as: "MaHD_hdbanhang",
    foreignKey: "MaHD",
  });
  hdbanhang.hasMany(cuahang, {
    as: "cuahangs",
    foreignKey: "MaHD",
  });

  // ORDER - KHUYẾN MÃI
  donhang.belongsToMany(khuyenmai, {
    as: "MaKM_khuyenmais",
    through: donhang_khuyenmai,
    foreignKey: "MaDH",
    otherKey: "MaKM",
  });
  khuyenmai.belongsToMany(donhang, {
    as: "MaDH_donhangs",
    through: donhang_khuyenmai,
    foreignKey: "MaKM",
    otherKey: "MaDH",
  });
  taikhoan.belongsToMany(khuyenmai, {
    as: "MaKM_khuyenmais",
    through: khuyenmai_taikhoan,
    foreignKey: "MaTK",
    otherKey: "MaKM",
  });
  khuyenmai.belongsToMany(taikhoan, {
    as: "MaTK_taikhoans",
    through: khuyenmai_taikhoan,
    foreignKey: "MaKM",
    otherKey: "MaTK",
  });
  // donhang 1 - 1 thanhtoan
  donhang.hasOne(thanhtoan, { as: "thanhtoan", foreignKey: "MaDH" });
  thanhtoan.belongsTo(donhang, { as: "MaDH_donhang", foreignKey: "MaDH" });

  // donhang 1 - 1 giaohang (1 đơn có thể có nhiều bản ghi giao? nếu muốn 1:1 thì hasOne)
  donhang.hasMany(giaohang, { as: "giaohangs", foreignKey: "MaDH" });
  giaohang.belongsTo(donhang, { as: "MaDH_donhang", foreignKey: "MaDH" });

  // shipper (taikhoan) có thể nhận nhiều giao hàng
  taikhoan.hasMany(giaohang, { as: "giaohangs", foreignKey: "MaShipper" });
  giaohang.belongsTo(taikhoan, {
    as: "MaShipper_taikhoan",
    foreignKey: "MaShipper",
  });
  // KHUYẾN MÃI - TÀI KHOẢN (USER)
  khuyenmai_taikhoan.belongsTo(khuyenmai, {
    as: "MaKM_khuyenmai",
    foreignKey: "MaKM",
  });
  khuyenmai.hasMany(khuyenmai_taikhoan, {
    as: "khuyenmai_taikhoans",
    foreignKey: "MaKM",
  });
  khuyenmai_taikhoan.belongsTo(taikhoan, {
    as: "MaTK_taikhoan",
    foreignKey: "MaTK",
  });
  taikhoan.hasMany(khuyenmai_taikhoan, {
    as: "khuyenmai_taikhoans",
    foreignKey: "MaTK",
  });

  yeucaudathang.belongsTo(taikhoan, {
    as: "MaTK_Buyer_taikhoan",
    foreignKey: "MaTK_Buyer",
  });

  denghicungcap.belongsTo(yeucaudathang, {
    as: "MaYCDH_yeucaudathang",
    foreignKey: "MaYCDH",
  });

  denghicungcap.belongsTo(taikhoan, {
    as: "MaTK_Seller_taikhoan",
    foreignKey: "MaTK_Seller",
  });

  denghicungcap.belongsTo(sanpham, {
    as: "MaSP_sanpham",
    foreignKey: "MaSP",
  });

  chitietchapnhan.belongsTo(denghicungcap, {
    as: "MaDNCC_denghicungcap",
    foreignKey: "MaDNCC",
  });

  chitietchapnhan.belongsTo(donhang, {
    as: "MaDH_donhang",
    foreignKey: "MaDH",
  });

  yeucaudathang.hasMany(denghicungcap, {
    as: "denghicungcaps",
    foreignKey: "MaYCDH",
  });

  denghicungcap.hasMany(chitietchapnhan, {
    as: "chitietchapnhans",
    foreignKey: "MaDNCC",
  });

  // ======================================
  // 📤 RETURN TẤT CẢ MODELS
  // ======================================
  return {
    chitiet_donhang,
    chitietchapnhan,
    chucvu,
    cuahang,
    danhmuc,
    denghicungcap,
    donhang,
    hdbanhang,
    hinhanh,
    kho,
    nhanvien,
    phongban,
    pttt,
    ptvc,
    sanpham,
    sanpham_danhmuc,
    sanpham_hinhanh,
    taikhoan,
    xuatnhapton,
    xuatnhapton_sanpham,
    yeucaudathang,
    vaitro,
    taikhoan_vaitro,
    password_reset_token,
    giohang,
    ctgh,
    lichsu_trangthai,
    giaohang,
    thanhtoan,
    khuyenmai,
    khuyenmai_taikhoan,
    donhang_khuyenmai,
    danhgiasanpham, // 🆕 THÊM VÀO RETURN
    danhgiacuahang, // 🆕 THÊM VÀO RETURN
  };
}

export { initModels };
export default initModels;
