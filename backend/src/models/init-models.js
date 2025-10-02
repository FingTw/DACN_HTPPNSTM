import { Sequelize } from "sequelize";
import chitiet_donhang from "./chitiet_donhang.js";
import chitietchapnhan from "./chitietchapnhan.js";
import chucvu from "./chucvu.js";
import cuahang from "./cuahang.js";
import danhmuc from "./danhmuc.js";
import denghicungcap from "./denghicungcap.js";
import donhang from "./donhang.js";
import hdbanhang from "./hdbanhang.js";
import hinhanh from "./hinhanh.js";
import kho from "./kho.js";
import nhanvien from "./nhanvien.js";
import phongban from "./phongban.js";
import pttt from "./pttt.js";
import ptvc from "./ptvc.js";
import sanpham from "./sanpham.js";
import sanpham_danhmuc from "./sanpham_danhmuc.js";
import sanpham_hinhanh from "./sanpham_hinhanh.js";
import taikhoan from "./taikhoan.js";
import xuatnhapton from "./xuatnhapton.js";
import xuatnhapton_sanpham from "./xuatnhapton_sanpham.js";
import yeucaudathang from "./yeucaudathang.js";

function initModels(sequelize) {
  const models = {
    chitiet_donhang: chitiet_donhang(sequelize),
    chitietchapnhan: chitietchapnhan(sequelize),
    chucvu: chucvu(sequelize),
    cuahang: cuahang(sequelize),
    danhmuc: danhmuc(sequelize),
    denghicungcap: denghicungcap(sequelize),
    donhang: donhang(sequelize),
    hdbanhang: hdbanhang(sequelize),
    hinhanh: hinhanh(sequelize),
    kho: kho(sequelize),
    nhanvien: nhanvien(sequelize),
    phongban: phongban(sequelize),
    pttt: pttt(sequelize),
    ptvc: ptvc(sequelize),
    sanpham: sanpham(sequelize),
    sanpham_danhmuc: sanpham_danhmuc(sequelize),
    sanpham_hinhanh: sanpham_hinhanh(sequelize),
    taikhoan: taikhoan(sequelize),
    xuatnhapton: xuatnhapton(sequelize),
    xuatnhapton_sanpham: xuatnhapton_sanpham(sequelize),
    yeucaudathang: yeucaudathang(sequelize),
  };

  Object.values(models).forEach((model) => {
    if (typeof model.associate === "function") {
      model.associate(models);
    }
  });

  return models;
}

export default initModels;
