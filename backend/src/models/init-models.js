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
import _sanpham from "./sanpham.js";
import _sanpham_danhmuc from "./sanpham_danhmuc.js";
import _sanpham_hinhanh from "./sanpham_hinhanh.js";
import _taikhoan from "./taikhoan.js";
import _xuatnhapton from "./xuatnhapton.js";
import _xuatnhapton_sanpham from "./xuatnhapton_sanpham.js";
import _yeucaudathang from "./yeucaudathang.js";

function initModels(sequelize) {
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

  danhmuc.belongsToMany(sanpham, { as: 'MaSP_sanpham_sanpham_danhmucs', through: sanpham_danhmuc, foreignKey: "MaDM", otherKey: "MaSP" });
  donhang.belongsToMany(sanpham, { as: 'MaSP_sanphams', through: chitiet_donhang, foreignKey: "MaDH", otherKey: "MaSP" });
  hinhanh.belongsToMany(sanpham, { as: 'MaSP_sanpham_sanpham_hinhanhs', through: sanpham_hinhanh, foreignKey: "MaHA", otherKey: "MaSP" });
  sanpham.belongsToMany(danhmuc, { as: 'MaDM_danhmucs', through: sanpham_danhmuc, foreignKey: "MaSP", otherKey: "MaDM" });
  sanpham.belongsToMany(donhang, { as: 'MaDH_donhangs', through: chitiet_donhang, foreignKey: "MaSP", otherKey: "MaDH" });
  sanpham.belongsToMany(hinhanh, { as: 'MaHA_hinhanhs', through: sanpham_hinhanh, foreignKey: "MaSP", otherKey: "MaHA" });
  sanpham.belongsToMany(xuatnhapton, { as: 'MaXNT_xuatnhaptons', through: xuatnhapton_sanpham, foreignKey: "MaSP", otherKey: "MaXNT" });
  xuatnhapton.belongsToMany(sanpham, { as: 'MaSP_sanpham_xuatnhapton_sanphams', through: xuatnhapton_sanpham, foreignKey: "MaXNT", otherKey: "MaSP" });
  nhanvien.belongsTo(chucvu, { as: "MaCV_chucvu", foreignKey: "MaCV"});
  chucvu.hasMany(nhanvien, { as: "nhanviens", foreignKey: "MaCV"});
  sanpham.belongsTo(cuahang, { as: "MaCH_cuahang", foreignKey: "MaCH"});
  cuahang.hasMany(sanpham, { as: "sanphams", foreignKey: "MaCH"});
  sanpham_danhmuc.belongsTo(danhmuc, { as: "MaDM_danhmuc", foreignKey: "MaDM"});
  danhmuc.hasMany(sanpham_danhmuc, { as: "sanpham_danhmucs", foreignKey: "MaDM"});
  yeucaudathang.belongsTo(danhmuc, { as: "MaDM_danhmuc", foreignKey: "MaDM"});
  danhmuc.hasMany(yeucaudathang, { as: "yeucaudathangs", foreignKey: "MaDM"});
  chitietchapnhan.belongsTo(denghicungcap, { as: "MaDNCC_denghicungcap", foreignKey: "MaDNCC"});
  denghicungcap.hasMany(chitietchapnhan, { as: "chitietchapnhans", foreignKey: "MaDNCC"});
  chitiet_donhang.belongsTo(donhang, { as: "MaDH_donhang", foreignKey: "MaDH"});
  donhang.hasMany(chitiet_donhang, { as: "chitiet_donhangs", foreignKey: "MaDH"});
  chitietchapnhan.belongsTo(donhang, { as: "MaDH_donhang", foreignKey: "MaDH"});
  donhang.hasMany(chitietchapnhan, { as: "chitietchapnhans", foreignKey: "MaDH"});
  cuahang.belongsTo(hinhanh, { as: "MaHA_CuaHang_hinhanh", foreignKey: "MaHA_CuaHang"});
  hinhanh.hasMany(cuahang, { as: "cuahangs", foreignKey: "MaHA_CuaHang"});
  danhmuc.belongsTo(hinhanh, { as: "MaHA_DanhMuc_hinhanh", foreignKey: "MaHA_DanhMuc"});
  hinhanh.hasMany(danhmuc, { as: "danhmucs", foreignKey: "MaHA_DanhMuc"});
  nhanvien.belongsTo(hinhanh, { as: "MaHA_Avatar_hinhanh", foreignKey: "MaHA_Avatar"});
  hinhanh.hasMany(nhanvien, { as: "nhanviens", foreignKey: "MaHA_Avatar"});
  sanpham_hinhanh.belongsTo(hinhanh, { as: "MaHA_hinhanh", foreignKey: "MaHA"});
  hinhanh.hasMany(sanpham_hinhanh, { as: "sanpham_hinhanhs", foreignKey: "MaHA"});
  taikhoan.belongsTo(hinhanh, { as: "MaHA_Avatar_hinhanh", foreignKey: "MaHA_Avatar"});
  hinhanh.hasMany(taikhoan, { as: "taikhoans", foreignKey: "MaHA_Avatar"});
  xuatnhapton.belongsTo(kho, { as: "MaKho_kho", foreignKey: "MaKho"});
  kho.hasMany(xuatnhapton, { as: "xuatnhaptons", foreignKey: "MaKho"});
  xuatnhapton.belongsTo(nhanvien, { as: "MaNV_nhanvien", foreignKey: "MaNV"});
  nhanvien.hasMany(xuatnhapton, { as: "xuatnhaptons", foreignKey: "MaNV"});
  nhanvien.belongsTo(phongban, { as: "MaPB_phongban", foreignKey: "MaPB"});
  phongban.hasMany(nhanvien, { as: "nhanviens", foreignKey: "MaPB"});
  donhang.belongsTo(pttt, { as: "MaPTTT_pttt", foreignKey: "MaPTTT"});
  pttt.hasMany(donhang, { as: "donhangs", foreignKey: "MaPTTT"});
  donhang.belongsTo(ptvc, { as: "MaPTVC_ptvc", foreignKey: "MaPTVC"});
  ptvc.hasMany(donhang, { as: "donhangs", foreignKey: "MaPTVC"});
  chitiet_donhang.belongsTo(sanpham, { as: "MaSP_sanpham", foreignKey: "MaSP"});
  sanpham.hasMany(chitiet_donhang, { as: "chitiet_donhangs", foreignKey: "MaSP"});
  denghicungcap.belongsTo(sanpham, { as: "MaSP_sanpham", foreignKey: "MaSP"});
  sanpham.hasMany(denghicungcap, { as: "denghicungcaps", foreignKey: "MaSP"});
  sanpham_danhmuc.belongsTo(sanpham, { as: "MaSP_sanpham", foreignKey: "MaSP"});
  sanpham.hasMany(sanpham_danhmuc, { as: "sanpham_danhmucs", foreignKey: "MaSP"});
  sanpham_hinhanh.belongsTo(sanpham, { as: "MaSP_sanpham", foreignKey: "MaSP"});
  sanpham.hasMany(sanpham_hinhanh, { as: "sanpham_hinhanhs", foreignKey: "MaSP"});
  xuatnhapton_sanpham.belongsTo(sanpham, { as: "MaSP_sanpham", foreignKey: "MaSP"});
  sanpham.hasMany(xuatnhapton_sanpham, { as: "xuatnhapton_sanphams", foreignKey: "MaSP"});
  yeucaudathang.belongsTo(sanpham, { as: "MaSP_sanpham", foreignKey: "MaSP"});
  sanpham.hasMany(yeucaudathang, { as: "yeucaudathangs", foreignKey: "MaSP"});
  cuahang.belongsTo(taikhoan, { as: "MaTK_taikhoan", foreignKey: "MaTK"});
  taikhoan.hasMany(cuahang, { as: "cuahangs", foreignKey: "MaTK"});
  denghicungcap.belongsTo(taikhoan, { as: "MaTK_Seller_taikhoan", foreignKey: "MaTK_Seller"});
  taikhoan.hasMany(denghicungcap, { as: "denghicungcaps", foreignKey: "MaTK_Seller"});
  donhang.belongsTo(taikhoan, { as: "MaTK_taikhoan", foreignKey: "MaTK"});
  taikhoan.hasMany(donhang, { as: "donhangs", foreignKey: "MaTK"});
  hdbanhang.belongsTo(taikhoan, { as: "MaTK_taikhoan", foreignKey: "MaTK"});
  taikhoan.hasMany(hdbanhang, { as: "hdbanhangs", foreignKey: "MaTK"});
  yeucaudathang.belongsTo(taikhoan, { as: "MaTK_Buyer_taikhoan", foreignKey: "MaTK_Buyer"});
  taikhoan.hasMany(yeucaudathang, { as: "yeucaudathangs", foreignKey: "MaTK_Buyer"});
  xuatnhapton_sanpham.belongsTo(xuatnhapton, { as: "MaXNT_xuatnhapton", foreignKey: "MaXNT"});
  xuatnhapton.hasMany(xuatnhapton_sanpham, { as: "xuatnhapton_sanphams", foreignKey: "MaXNT"});
  denghicungcap.belongsTo(yeucaudathang, { as: "MaYCDH_yeucaudathang", foreignKey: "MaYCDH"});
  yeucaudathang.hasMany(denghicungcap, { as: "denghicungcaps", foreignKey: "MaYCDH"});

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
  };
}




export { initModels };
