//import initModels from "../models/init-models.js";
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";

const models = initModels(sequelize);
const { cuahang, taikhoan, hinhanh, sanpham } = models;

// 🟢 Đăng ký thông tin gian hàng - CHỈ USER ĐÃ ĐĂNG NHẬP
export const createCuahang = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const { MaCH, TenCH, SLTheoDoi, DiemDG, MaHA_CuaHang } = req.body;

    // Kiểm tra gian hàng đã tồn tại chưa
    const existingCH = await cuahang.findByPk(MaCH);
    if (existingCH) {
      return res.status(400).json({ message: "Mã gian hàng đã tồn tại" });
    }

    // Kiểm tra user đã có cửa hàng chưa
    const existingUserCH = await cuahang.findOne({
      where: { MaTK: user.MaTK },
    });
    if (existingUserCH) {
      return res.status(400).json({ message: "Bạn đã có cửa hàng rồi" });
    }

    // Kiểm tra hình ảnh tồn tại (nếu có MaHA_CuaHang)
    if (MaHA_CuaHang) {
      const existingHA = await hinhanh.findByPk(MaHA_CuaHang);
      if (!existingHA) {
        return res.status(400).json({ message: "Hình ảnh không tồn tại" });
      }
    }

    const newCuahang = await cuahang.create({
      MaCH,
      TenCH,
      SLTheoDoi: SLTheoDoi || 0,
      DiemDG: DiemDG || 0,
      MaHA_CuaHang: MaHA_CuaHang || null,
      MaTK: user.MaTK, // Gán cửa hàng cho user hiện tại
    });

    res.status(201).json({
      message: "Đăng ký gian hàng thành công",
      data: newCuahang,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi đăng ký gian hàng",
      error: err.message,
    });
  }
};

// 🟢 Lấy danh sách tất cả gian hàng - AI CŨNG XEM ĐƯỢC
export const getAllCuahang = async (req, res) => {
  try {
    const { include } = req.query;

    let options = {
      order: [["TenCH", "ASC"]],
    };

    if (include) {
      const includes = include.split(",");
      options.include = [];

      if (includes.includes("taikhoan")) {
        options.include.push({
          model: taikhoan,
          attributes: ["MaTK", "TenDangNhap", "Email"],
        });
      }

      if (includes.includes("hinhanh")) {
        options.include.push({
          model: hinhanh,
          as: "MaHA_CuaHang_hinhanh",
          attributes: ["MaHA", "DuongDan", "MoTa"],
        });
      }
    }

    const data = await cuahang.findAll(options);

    res.json({
      message: "Lấy danh sách gian hàng thành công",
      count: data.length,
      data: data,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách gian hàng",
      error: err.message,
    });
  }
};

// 🟢 Lấy thông tin gian hàng theo mã - AI CŨNG XEM ĐƯỢC
export const getCuahangById = async (req, res) => {
  try {
    const { MaCH } = req.params;
    const { include } = req.query;

    let options = {
      where: { MaCH },
    };

    if (include) {
      const includes = include.split(",");
      options.include = [];

      if (includes.includes("taikhoan")) {
        options.include.push({
          model: taikhoan,
          attributes: ["MaTK", "TenDangNhap", "Email", "LoaiTK"],
        });
      }

      if (includes.includes("hinhanh")) {
        options.include.push({
          model: hinhanh,
          as: "MaHA_CuaHang_hinhanh",
          attributes: ["MaHA", "DuongDan", "MoTa", "NgayTao"],
        });
      }
    }

    const item = await cuahang.findOne(options);

    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy gian hàng" });
    }

    res.json({
      message: "Lấy thông tin gian hàng thành công",
      data: item,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy thông tin gian hàng",
      error: err.message,
    });
  }
};

// 🟢 Chỉnh sửa thông tin gian hàng - CHỈ CHỦ CỬA HÀNG
export const updateCuahang = async (req, res) => {
  try {
    const { MaCH } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const { TenCH, SLTheoDoi, DiemDG, MaHA_CuaHang } = req.body;

    const item = await cuahang.findByPk(MaCH);
    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy gian hàng" });
    }

    // Kiểm tra quyền sở hữu
    if (item.MaTK !== user.MaTK) {
      return res.status(403).json({
        message: "Bạn không có quyền chỉnh sửa cửa hàng này",
      });
    }

    // Kiểm tra hình ảnh tồn tại (nếu có MaHA_CuaHang)
    if (MaHA_CuaHang) {
      const existingHA = await hinhanh.findByPk(MaHA_CuaHang);
      if (!existingHA) {
        return res.status(400).json({ message: "Hình ảnh không tồn tại" });
      }
    }

    // Cập nhật thông tin (không cho phép thay đổi MaTK)
    await item.update({
      TenCH: TenCH !== undefined ? TenCH : item.TenCH,
      SLTheoDoi: SLTheoDoi !== undefined ? SLTheoDoi : item.SLTheoDoi,
      DiemDG: DiemDG !== undefined ? DiemDG : item.DiemDG,
      MaHA_CuaHang:
        MaHA_CuaHang !== undefined ? MaHA_CuaHang : item.MaHA_CuaHang,
    });

    res.json({
      message: "Cập nhật thông tin gian hàng thành công",
      data: item,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi cập nhật gian hàng",
      error: err.message,
    });
  }
};

// 🟢 Xóa gian hàng - CHỈ CHỦ CỬA HÀNG (ĐÃ CẬP NHẬT)
export const deleteCuahang = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { MaCH } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const item = await cuahang.findByPk(MaCH);
    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy gian hàng" });
    }

    // Kiểm tra quyền sở hữu
    if (item.MaTK !== user.MaTK) {
      return res.status(403).json({
        message: "Bạn không có quyền xóa cửa hàng này",
      });
    }

    // 🚨 Kiểm tra có sản phẩm thuộc cửa hàng không
    const productsCount = await sanpham.count({
      where: { MaCH: MaCH },
    });

    if (productsCount > 0) {
      return res.status(400).json({
        message: `Không thể xóa cửa hàng. Còn ${productsCount} sản phẩm thuộc cửa hàng này. Hãy xóa hoặc chuyển sản phẩm trước.`,
      });
    }

    await item.destroy({ transaction });
    await transaction.commit();

    res.json({
      message: "Xóa gian hàng thành công",
    });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({
      message: "Lỗi khi xóa gian hàng",
      error: err.message,
    });
  }
};

// 🟢 Lấy thông tin cửa hàng của tôi - CHỦ CỬA HÀNG
export const getMyCuahang = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const item = await cuahang.findOne({
      where: { MaTK: user.MaTK },
      include: [
        {
          model: hinhanh,
          as: "MaHA_CuaHang_hinhanh",
          attributes: ["MaHA", "DuongDan", "MoTa"],
        },
      ],
    });

    if (!item) {
      return res.status(404).json({ message: "Bạn chưa có cửa hàng" });
    }

    res.json({
      message: "Lấy thông tin cửa hàng thành công",
      data: item,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy thông tin cửa hàng",
      error: err.message,
    });
  }
};

// 🟢 Tìm kiếm gian hàng theo tên - AI CŨNG XEM ĐƯỢC
export const searchCuahang = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập từ khóa tìm kiếm" });
    }

    const { Op } = await import("sequelize");

    const data = await cuahang.findAll({
      where: {
        TenCH: {
          [Op.like]: `%${keyword}%`,
        },
      },
      order: [["TenCH", "ASC"]],
    });

    res.json({
      message: "Tìm kiếm gian hàng thành công",
      count: data.length,
      data: data,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi tìm kiếm gian hàng",
      error: err.message,
    });
  }
};

// 🟢 Cập nhật số lượng theo dõi - AI CŨNG ĐƯỢC (không cần đăng nhập)
export const updateTheoDoi = async (req, res) => {
  try {
    const { MaCH } = req.params;
    const { action } = req.body; // 'tang' hoặc 'giam'

    const item = await cuahang.findByPk(MaCH);
    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy gian hàng" });
    }

    let newSLTheoDoi = item.SLTheoDoi;

    if (action === "tang") {
      newSLTheoDoi += 1;
    } else if (action === "giam" && newSLTheoDoi > 0) {
      newSLTheoDoi -= 1;
    }

    await item.update({ SLTheoDoi: newSLTheoDoi });

    res.json({
      message: "Cập nhật số lượng theo dõi thành công",
      data: item,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi cập nhật số lượng theo dõi",
      error: err.message,
    });
  }
};

// // 🟢 Thống kê sản phẩm tồn kho của cửa hàng - CHỦ CỬA HÀNG
// export const getThongKeTonKho = async (req, res) => {
//   try {
//     const user = req.user;
//     if (!user) {
//       return res.status(401).json({ message: "Chưa đăng nhập" });
//     }

//     // Tìm cửa hàng của user
//     const cuaHang = await cuahang.findOne({
//       where: { MaTK: user.MaTK },
//     });

//     if (!cuaHang) {
//       return res.status(404).json({ message: "Bạn không có cửa hàng" });
//     }

//     // Lấy tất cả sản phẩm của cửa hàng
//     const products = await sanpham.findAll({
//       where: { MaCH: cuaHang.MaCH },
//       attributes: [
//         'MaSP',
//         'TenSP',
//         'SLTon',
//         'GiaBan',
//         'TrangThai',
//         'DVT'
//       ],
//       order: [['SLTon', 'DESC']] // Sắp xếp theo tồn kho giảm dần
//     });

//     // Tính toán thống kê
//     const tongSoSanPham = products.length;
//     const tongSoLuongTon = products.reduce((sum, product) => sum + (product.SLTon || 0), 0);
//     const tongGiaTriTonKho = products.reduce((sum, product) => {
//       return sum + ((product.SLTon || 0) * parseFloat(product.GiaBan || 0));
//     }, 0);

//     // Phân loại sản phẩm theo mức độ tồn kho
//     const sanPhamSapHet = products.filter(p => p.SLTon > 0 && p.SLTon <= 10);
//     const sanPhamHetHang = products.filter(p => p.SLTon === 0);
//     const sanPhamConNhieu = products.filter(p => p.SLTon > 10);

//     // Top sản phẩm tồn kho nhiều nhất
//     const topTonKhoNhieu = products.slice(0, 5);

//     // Top sản phẩm sắp hết hàng
//     const topSapHetHang = [...sanPhamSapHet]
//       .sort((a, b) => a.SLTon - b.SLTon)
//       .slice(0, 5);

//     res.json({
//       message: "Thống kê tồn kho thành công",
//       data: {
//         thongTinCuaHang: {
//           MaCH: cuaHang.MaCH,
//           TenCH: cuaHang.TenCH
//         },
//         tongQuan: {
//           tongSoSanPham,
//           tongSoLuongTon,
//           tongGiaTriTonKho: Math.round(tongGiaTriTonKho),
//           trungBinhTonKho: tongSoSanPham > 0 ? Math.round(tongSoLuongTon / tongSoSanPham) : 0
//         },
//         phanLoaiTonKho: {
//           sapHetHang: {
//             soLuong: sanPhamSapHet.length,
//             tyLe: tongSoSanPham > 0 ? Math.round((sanPhamSapHet.length / tongSoSanPham) * 100) : 0
//           },
//           hetHang: {
//             soLuong: sanPhamHetHang.length,
//             tyLe: tongSoSanPham > 0 ? Math.round((sanPhamHetHang.length / tongSoSanPham) * 100) : 0
//           },
//           conNhieu: {
//             soLuong: sanPhamConNhieu.length,
//             tyLe: tongSoSanPham > 0 ? Math.round((sanPhamConNhieu.length / tongSoSanPham) * 100) : 0
//           }
//         },
//         topSanPham: {
//           tonKhoNhieuNhat: topTonKhoNhieu.map(p => ({
//             MaSP: p.MaSP,
//             TenSP: p.TenSP,
//             SLTon: p.SLTon,
//             GiaBan: p.GiaBan,
//             GiaTriTonKho: (p.SLTon || 0) * parseFloat(p.GiaBan || 0)
//           })),
//           sapHetHang: topSapHetHang.map(p => ({
//             MaSP: p.MaSP,
//             TenSP: p.TenSP,
//             SLTon: p.SLTon,
//             GiaBan: p.GiaBan,
//             CanNhapThem: 50 - (p.SLTon || 0)
//           }))
//         },
//         chiTietSanPham: products.map(p => ({
//           MaSP: p.MaSP,
//           TenSP: p.TenSP,
//           SLTon: p.SLTon,
//           GiaBan: p.GiaBan,
//           DVT: p.DVT,
//           TrangThai: p.TrangThai,
//           GiaTriTonKho: (p.SLTon || 0) * parseFloat(p.GiaBan || 0),
//           MucDoCanhBao: p.SLTon === 0 ? 'Hết hàng' :
//                         p.SLTon <= 10 ? 'Sắp hết' : 'Đủ hàng'
//         }))
//       }
//     });

//   } catch (err) {
//     console.error("❌ Error getting inventory stats:", err.message);
//     res.status(500).json({
//       message: "Lỗi khi thống kê tồn kho",
//       error: err.message,
//     });
//   }
// };

// 🟢 Thống kê tồn kho với bộ lọc - CHỦ CỬA HÀNG
export const getThongKeTonKhoFilter = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const { minStock, maxStock, trangThai } = req.query;

    // Tìm cửa hàng của user
    const cuaHang = await cuahang.findOne({
      where: { MaTK: user.MaTK },
    });

    if (!cuaHang) {
      return res.status(404).json({ message: "Bạn không có cửa hàng" });
    }

    const { Op } = await import("sequelize");

    // Xây dựng điều kiện filter
    let whereCondition = { MaCH: cuaHang.MaCH };

    if (minStock !== undefined || maxStock !== undefined) {
      whereCondition.SLTon = {};
      if (minStock !== undefined)
        whereCondition.SLTon[Op.gte] = parseInt(minStock);
      if (maxStock !== undefined)
        whereCondition.SLTon[Op.lte] = parseInt(maxStock);
    }

    if (trangThai) {
      whereCondition.TrangThai = trangThai;
    }

    const products = await sanpham.findAll({
      where: whereCondition,
      attributes: ["MaSP", "TenSP", "SLTon", "GiaBan", "TrangThai", "DVT"],
      order: [["SLTon", "DESC"]],
    });

    res.json({
      message: "Thống kê tồn kho với bộ lọc thành công",
      data: {
        filters: {
          minStock,
          maxStock,
          trangThai,
        },
        tongSoSanPham: products.length,
        sanPham: products,
      },
    });
  } catch (err) {
    console.error("❌ Error getting filtered inventory:", err.message);
    res.status(500).json({
      message: "Lỗi khi thống kê tồn kho",
      error: err.message,
    });
  }
};

// 🟢 Thống kê sản phẩm tồn kho của cửa hàng - KHÔNG CẦN AUTH (TEST)
export const getThongKeTonKho = async (req, res) => {
  try {
    // 🟢 NHẬN MaCH TỪ PARAMS (cho route public) HOẶC TỪ USER (cho route protected)
    let MaCH;

    if (req.params.MaCH) {
      // Route public: /api/cuahang/CH004/thong-ke-ton-kho
      MaCH = req.params.MaCH;
    } else {
      // Route protected: /api/cuahang/my/store/thong-ke-ton-kho
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Chưa đăng nhập" });
      }

      const cuaHang = await cuahang.findOne({
        where: { MaTK: user.MaTK },
      });

      if (!cuaHang) {
        return res.status(404).json({ message: "Bạn không có cửa hàng" });
      }

      MaCH = cuaHang.MaCH;
    }

    console.log(`📊 [THONGKE] Getting inventory stats for store: ${MaCH}`);

    // Kiểm tra cửa hàng tồn tại
    const cuaHangInfo = await cuahang.findByPk(MaCH);
    if (!cuaHangInfo) {
      return res.status(404).json({ message: "Không tìm thấy cửa hàng" });
    }

    // Lấy tất cả sản phẩm của cửa hàng
    const products = await sanpham.findAll({
      where: { MaCH: MaCH },
      attributes: ["MaSP", "TenSP", "SLTon", "GiaBan", "TrangThai", "DVT"],
      order: [["SLTon", "DESC"]],
    });

    // Tính toán thống kê
    const tongSoSanPham = products.length;
    const tongSoLuongTon = products.reduce(
      (sum, product) => sum + (product.SLTon || 0),
      0
    );
    const tongGiaTriTonKho = products.reduce((sum, product) => {
      return sum + (product.SLTon || 0) * parseFloat(product.GiaBan || 0);
    }, 0);

    // Phân loại sản phẩm
    const sanPhamSapHet = products.filter((p) => p.SLTon > 0 && p.SLTon <= 10);
    const sanPhamHetHang = products.filter((p) => p.SLTon === 0);
    const sanPhamConNhieu = products.filter((p) => p.SLTon > 10);

    // Top sản phẩm
    const topTonKhoNhieu = products.slice(0, 5);
    const topSapHetHang = [...sanPhamSapHet]
      .sort((a, b) => a.SLTon - b.SLTon)
      .slice(0, 5);

    res.json({
      message: "Thống kê tồn kho thành công",
      data: {
        thongTinCuaHang: {
          MaCH: cuaHangInfo.MaCH,
          TenCH: cuaHangInfo.TenCH,
        },
        tongQuan: {
          tongSoSanPham,
          tongSoLuongTon,
          tongGiaTriTonKho: Math.round(tongGiaTriTonKho),
          trungBinhTonKho:
            tongSoSanPham > 0 ? Math.round(tongSoLuongTon / tongSoSanPham) : 0,
        },
        phanLoaiTonKho: {
          sapHetHang: {
            soLuong: sanPhamSapHet.length,
            tyLe:
              tongSoSanPham > 0
                ? Math.round((sanPhamSapHet.length / tongSoSanPham) * 100)
                : 0,
          },
          hetHang: {
            soLuong: sanPhamHetHang.length,
            tyLe:
              tongSoSanPham > 0
                ? Math.round((sanPhamHetHang.length / tongSoSanPham) * 100)
                : 0,
          },
          conNhieu: {
            soLuong: sanPhamConNhieu.length,
            tyLe:
              tongSoSanPham > 0
                ? Math.round((sanPhamConNhieu.length / tongSoSanPham) * 100)
                : 0,
          },
        },
        topSanPham: {
          tonKhoNhieuNhat: topTonKhoNhieu.map((p) => ({
            MaSP: p.MaSP,
            TenSP: p.TenSP,
            SLTon: p.SLTon,
            GiaBan: p.GiaBan,
            GiaTriTonKho: (p.SLTon || 0) * parseFloat(p.GiaBan || 0),
          })),
          sapHetHang: topSapHetHang.map((p) => ({
            MaSP: p.MaSP,
            TenSP: p.TenSP,
            SLTon: p.SLTon,
            GiaBan: p.GiaBan,
            CanNhapThem: 50 - (p.SLTon || 0),
          })),
        },
        chiTietSanPham: products.map((p) => ({
          MaSP: p.MaSP,
          TenSP: p.TenSP,
          SLTon: p.SLTon,
          GiaBan: p.GiaBan,
          DVT: p.DVT,
          TrangThai: p.TrangThai,
          GiaTriTonKho: (p.SLTon || 0) * parseFloat(p.GiaBan || 0),
          MucDoCanhBao:
            p.SLTon === 0 ? "Hết hàng" : p.SLTon <= 10 ? "Sắp hết" : "Đủ hàng",
        })),
      },
    });
  } catch (err) {
    console.error("❌ Error getting inventory stats:", err.message);
    res.status(500).json({
      message: "Lỗi khi thống kê tồn kho",
      error: err.message,
    });
  }
};
