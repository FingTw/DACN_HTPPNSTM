  import express from "express";
  import {
    createKhuyenMai,
    getAllKhuyenMai,
    updateKhuyenMai,
    deleteKhuyenMai,
    assignKhuyenMaiToUser,
    getUserKhuyenMai,
    nhanKhuyenMai,
    getKhuyenMaiForCustomer,
    getKhuyenMaiByCuaHang
  } from "../controllers/khuyenmaiController.js";

  const router = express.Router();

  // 🔥 SỬA LẠI CÁC ROUTES CHO ĐÚNG VỚI FRONTEND

  // Routes cơ bản - SỬA LẠI PATH
  router.post("/create", createKhuyenMai);                   
  router.get("/manage/all", getAllKhuyenMai);                    

  // Routes quản lý
  router.get("/cua-hang/my", getKhuyenMaiByCuaHang);   

  // Routes CRUD
  router.put("/:MaKM", updateKhuyenMai);               
  router.delete("/:MaKM", deleteKhuyenMai);            

  // Routes cho khách hàng
  router.post("/nhan-khuyen-mai", nhanKhuyenMai);       
  router.get("/khach-hang/khuyen-mai", getKhuyenMaiForCustomer); 
  router.get("/user-khuyen-mai", getUserKhuyenMai);     

  // Routes bổ sung
  router.post("/assign", assignKhuyenMaiToUser);        

  export default router;