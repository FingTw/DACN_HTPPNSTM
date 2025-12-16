// src/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { initModels } from "../models/init-models.js";
import sequelize from "../config/db.js";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import fetch from "node-fetch";

dotenv.config();

// khởi tạo models
const models = initModels(sequelize);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// console.log(models);
// console.log(models.taikhoan);
// console.log("JWT_SECRET:", process.env.JWT_SECRET);

const {
  taikhoan,
  sanpham,
  donhang,
  vaitro,
  taikhoan_vaitro,
  password_reset_token,
  hinhanh,
  cuahang,
} = models;

import { sendEmail } from "../services/emailService.js";
import { Op } from "sequelize";

const authController = {
  // ==============================
  // ĐĂNG NHẬP GOOGLE
  // ==============================
  googleLogin: async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Thiếu token Google" });
      }

      console.log("🔧 Google token received:", token.substring(0, 50) + "...");

      try {
        // Xác minh token với Google
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        console.log("✅ Google payload:", { googleId, email, name });

        // Tìm tài khoản theo email hoặc googleId
        let user = await taikhoan.findOne({
          where: {
            [Op.or]: [{ Email: email }, { GoogleId: googleId }],
          },
          include: [
            {
              model: taikhoan_vaitro,
              as: "taikhoan_vaitros",
              include: [
                {
                  model: vaitro,
                  as: "vaitro",
                  attributes: ["MaVT", "TenVT"],
                },
              ],
            },
            {
              model: cuahang,
              as: "cuahangs",
              attributes: ["MaCH"],
            },
          ],
        });

        // Nếu user chưa tồn tại, tạo mới
        if (!user) {
          console.log("🆕 Tạo user mới từ Google");

          // Tạo mã tài khoản mới
          const now = new Date();
          const prefix =
            "TK" +
            now.getFullYear().toString().slice(2) +
            String(now.getMonth() + 1).padStart(2, "0");

          const last = await taikhoan.findOne({
            where: { MaTK: { [Op.like]: `${prefix}%` } },
            order: [["MaTK", "DESC"]],
          });

          let newId = prefix + "0001";
          if (last) {
            const num = parseInt(last.MaTK.slice(6)) + 1;
            newId = prefix + num.toString().padStart(4, "0");
          }

          // Tạo user mới
          user = await taikhoan.create({
            MaTK: newId,
            TenDangNhap: email,
            Email: email,
            HoTen: name,
            GoogleId: googleId,
            MatKhau: await bcrypt.hash(
              crypto.randomBytes(16).toString("hex"),
              10
            ),
            NgayTao: new Date(),
            TrangThai: "Hoạt động",
          });

          // Gán role mặc định
          const khachRole = await vaitro.findOne({
            where: { TenVT: "Khách Hàng" },
          });
          if (khachRole) {
            await taikhoan_vaitro.create({
              MaTK: user.MaTK,
              MaVT: khachRole.MaVT,
            });
          }

          // Lấy lại user với đầy đủ thông tin
          user = await taikhoan.findByPk(user.MaTK, {
            include: [
              {
                model: taikhoan_vaitro,
                as: "taikhoan_vaitros",
                include: [
                  {
                    model: vaitro,
                    as: "vaitro",
                    attributes: ["MaVT", "TenVT"],
                  },
                ],
              },
              {
                model: cuahang,
                as: "cuahangs",
                attributes: ["MaCH"],
              },
            ],
          });
        } else {
          console.log("✅ User đã tồn tại, cập nhật GoogleId nếu cần");
          // Cập nhật GoogleId nếu user tồn tại nhưng chưa có GoogleId
          if (!user.GoogleId) {
            user.GoogleId = googleId;
            await user.save();
          }
        }

        // Lấy danh sách vai trò
        const roleNames =
          user.taikhoan_vaitros
            ?.map((relation) => relation.vaitro?.TenVT)
            .filter(Boolean) || [];

        const primaryRole = roleNames.includes("Admin")
          ? "Admin"
          : roleNames.length > 0
          ? roleNames[0]
          : null;

        const userStoreId = user.cuahangs?.[0]?.MaCH || null;

        // Tạo JWT token
        const jwtToken = jwt.sign(
          {
            MaTK: user.MaTK,
            TenDangNhap: user.TenDangNhap,
            role: primaryRole,
            roles: roleNames,
            MaCH: userStoreId,
          },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        // Format response
        const userResponse = {
          MaTK: user.MaTK,
          TenDangNhap: user.TenDangNhap,
          HoTen: user.HoTen,
          Email: user.Email,
          role: primaryRole,
          roles: roleNames,
          MaCH: userStoreId,
        };

        console.log(
          "✅ Google login thành công cho user:",
          userResponse.TenDangNhap
        );

        return res.json({
          message: "Đăng nhập Google thành công",
          token: jwtToken,
          user: userResponse,
        });
      } catch (googleError) {
        console.error("❌ Lỗi xác minh Google token:", googleError);
        return res.status(400).json({
          message: "Token Google không hợp lệ",
          error: googleError.message,
        });
      }
    } catch (error) {
      console.error("❌ Lỗi đăng nhập Google:", error);
      return res.status(500).json({
        message: "Lỗi đăng nhập Google",
        error: error.message,
      });
    }
  },

  // ==============================
  // ĐĂNG NHẬP FACEBOOK
  // ==============================
  facebookLogin: async (req, res) => {
    try {
      const { accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).json({ message: "Thiếu access token Facebook" });
      }

      console.log("🔧 Facebook token received");

      try {
        // Xác minh token với Facebook
        const fbResponse = await fetch(
          `https://graph.facebook.com/v19.0/me?fields=id,name,email,picture&access_token=${accessToken}`
        );

        const fbData = await fbResponse.json();

        if (!fbResponse.ok) {
          console.error("❌ Facebook API error:", fbData.error);
          return res.status(400).json({
            message: "Token Facebook không hợp lệ",
            error: fbData.error?.message,
          });
        }

        const { id: facebookId, email, name } = fbData;
        console.log("✅ Facebook payload:", { facebookId, email, name });

        // Tìm tài khoản theo email hoặc facebookId
        let user = await taikhoan.findOne({
          where: {
            [Op.or]: [{ Email: email }, { FacebookId: facebookId }],
          },
          include: [
            {
              model: taikhoan_vaitro,
              as: "taikhoan_vaitros",
              include: [
                {
                  model: vaitro,
                  as: "vaitro",
                  attributes: ["MaVT", "TenVT"],
                },
              ],
            },
            {
              model: cuahang,
              as: "cuahangs",
              attributes: ["MaCH"],
            },
          ],
        });

        // Nếu user chưa tồn tại, tạo mới
        if (!user) {
          console.log("🆕 Tạo user mới từ Facebook");

          // Tạo mã tài khoản mới
          const now = new Date();
          const prefix =
            "TK" +
            now.getFullYear().toString().slice(2) +
            String(now.getMonth() + 1).padStart(2, "0");

          const last = await taikhoan.findOne({
            where: { MaTK: { [Op.like]: `${prefix}%` } },
            order: [["MaTK", "DESC"]],
          });

          let newId = prefix + "0001";
          if (last) {
            const num = parseInt(last.MaTK.slice(6)) + 1;
            newId = prefix + num.toString().padStart(4, "0");
          }

          // Tạo user mới
          user = await taikhoan.create({
            MaTK: newId,
            TenDangNhap: email || `fb_${facebookId}`,
            Email: email,
            HoTen: name,
            FacebookId: facebookId,
            MatKhau: await bcrypt.hash(
              crypto.randomBytes(16).toString("hex"),
              10
            ),
            NgayTao: new Date(),
            TrangThai: "Hoạt động",
          });

          // Gán role mặc định
          const khachRole = await vaitro.findOne({
            where: { TenVT: "Khách Hàng" },
          });
          if (khachRole) {
            await taikhoan_vaitro.create({
              MaTK: user.MaTK,
              MaVT: khachRole.MaVT,
            });
          }

          // Lấy lại user với đầy đủ thông tin
          user = await taikhoan.findByPk(user.MaTK, {
            include: [
              {
                model: taikhoan_vaitro,
                as: "taikhoan_vaitros",
                include: [
                  {
                    model: vaitro,
                    as: "vaitro",
                    attributes: ["MaVT", "TenVT"],
                  },
                ],
              },
              {
                model: cuahang,
                as: "cuahangs",
                attributes: ["MaCH"],
              },
            ],
          });
        } else {
          console.log("✅ User đã tồn tại, cập nhật FacebookId nếu cần");
          // Cập nhật FacebookId nếu user tồn tại nhưng chưa có FacebookId
          if (!user.FacebookId) {
            user.FacebookId = facebookId;
            await user.save();
          }
        }

        // Lấy danh sách vai trò
        const roleNames =
          user.taikhoan_vaitros
            ?.map((relation) => relation.vaitro?.TenVT)
            .filter(Boolean) || [];

        const primaryRole = roleNames.includes("Admin")
          ? "Admin"
          : roleNames.length > 0
          ? roleNames[0]
          : null;

        const userStoreId = user.cuahangs?.[0]?.MaCH || null;

        // Tạo JWT token
        const jwtToken = jwt.sign(
          {
            MaTK: user.MaTK,
            TenDangNhap: user.TenDangNhap,
            role: primaryRole,
            roles: roleNames,
            MaCH: userStoreId,
          },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        // Format response
        const userResponse = {
          MaTK: user.MaTK,
          TenDangNhap: user.TenDangNhap,
          HoTen: user.HoTen,
          Email: user.Email,
          role: primaryRole,
          roles: roleNames,
          MaCH: userStoreId,
        };

        console.log(
          "✅ Facebook login thành công cho user:",
          userResponse.TenDangNhap
        );

        return res.json({
          message: "Đăng nhập Facebook thành công",
          token: jwtToken,
          user: userResponse,
        });
      } catch (fbError) {
        console.error("❌ Lỗi xác minh Facebook token:", fbError);
        return res.status(400).json({
          message: "Token Facebook không hợp lệ",
          error: fbError.message,
        });
      }
    } catch (error) {
      console.error("❌ Lỗi đăng nhập Facebook:", error);
      return res.status(500).json({
        message: "Lỗi đăng nhập Facebook",
        error: error.message,
      });
    }
  },

  // Trong authController.js - Thêm API mới
  getProfile: async (req, res) => {
    try {
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

      const { MaTK } = decoded;

      // Lấy thông tin tài khoản từ database
      const account = await taikhoan.findByPk(MaTK, {
        include: [
          {
            model: hinhanh,
            as: "MaHA_Avatar_hinhanh",
            attributes: ["MaHA", "URL", "MoTa"],
          },
        ],
      });

      if (!account) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản" });
      }

      // Format response
      const profileData = {
        MaTK: account.MaTK,
        TenDangNhap: account.TenDangNhap,
        HoTen: account.HoTen,
        SDT: account.SDT,
        Email: account.Email,
        MaHA_Avatar: account.MaHA_Avatar,
        Avatar: account.MaHA_Avatar_hinhanh
          ? {
              MaHA: account.MaHA_Avatar_hinhanh.MaHA,
              URL: account.MaHA_Avatar_hinhanh.URL,
              MoTa: account.MaHA_Avatar_hinhanh.MoTa,
            }
          : null,
      };

      return res.json({
        message: "Lấy thông tin profile thành công",
        data: profileData,
      });
    } catch (err) {
      console.error("❌ Lỗi lấy thông tin profile:", err);
      return res.status(500).json({ message: err.message });
    }
  },
  // API upload ảnh
  uploadAvatar: async (req, res) => {
    try {
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

      const { MaTK } = decoded;

      if (!req.file) {
        return res.status(400).json({ message: "Không có file được upload" });
      }

      // Tìm tài khoản
      const account = await taikhoan.findByPk(MaTK);
      if (!account) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản" });
      }

      // Tạo URL cho file
      const fileUrl = `/uploads/avatars/${req.file.filename}`;
      // Tạo bản ghi ảnh mới
      const now = new Date();
      const prefix =
        "HA" +
        now.getFullYear().toString().slice(2) +
        String(now.getMonth() + 1).padStart(2, "0");

      const lastImage = await hinhanh.findOne({
        where: { MaHA: { [Op.like]: `${prefix}%` } },
        order: [["MaHA", "DESC"]],
      });

      let newId = prefix + "0001";
      if (lastImage) {
        const num = parseInt(lastImage.MaHA.slice(6)) + 1;
        newId = prefix + num.toString().padStart(4, "0");
      }

      const newImage = await hinhanh.create({
        MaHA: newId,
        URL: fileUrl,
        MoTa: `Avatar của ${account.TenDangNhap}`,
      });

      // Cập nhật avatar cho tài khoản
      account.MaHA_Avatar = newImage.MaHA;
      await account.save();

      // Lấy thông tin tài khoản đã cập nhật (KHÔNG DÙNG INCLUDE)
      const updatedAccount = await taikhoan.findByPk(MaTK);

      // Lấy thông tin ảnh riêng biệt
      const avatarInfo = await hinhanh.findByPk(newImage.MaHA);

      // Format response thủ công
      const responseData = {
        MaTK: updatedAccount.MaTK,
        TenDangNhap: updatedAccount.TenDangNhap,
        HoTen: updatedAccount.HoTen,
        SDT: updatedAccount.SDT,
        Email: updatedAccount.Email,
        MaHA_Avatar: updatedAccount.MaHA_Avatar,
        Avatar: avatarInfo
          ? {
              MaHA: avatarInfo.MaHA,
              URL: avatarInfo.URL,
              MoTa: avatarInfo.MoTa,
            }
          : null,
      };

      return res.json({
        message: "Upload avatar thành công",
        data: responseData,
      });
    } catch (err) {
      console.error("❌ Lỗi upload avatar:", err);
      return res.status(500).json({ message: err.message });
    }
  },
  // ==============================
  // Cập nhật thông tin cá nhân
  // ==============================
  updatePersonalInfo: async (req, res) => {
    const transaction = await sequelize.transaction(); // 🟢 Dùng transaction để an toàn
    try {
      // ... (Đoạn lấy token giữ nguyên) ...
      const authHeader = req.headers.authorization;
      if (!authHeader)
        return res.status(401).json({ message: "Không có token" });
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { MaTK } = decoded;

      const { HoTen, SDT, Email, TenDangNhap } = req.body;

      const account = await taikhoan.findByPk(MaTK, { transaction });
      if (!account) {
        await transaction.rollback();
        return res.status(404).json({ message: "Không tìm thấy tài khoản" });
      }

      // 🟢 1. XỬ LÝ FILE ẢNH (Nếu có gửi lên)
      if (req.file) {
        // a. Tạo URL (đặt vào thư mục avatars để khớp với nơi multer lưu)
        const fileUrl = `/uploads/avatars/${req.file.filename}`;

        // b. Tạo mã hình ảnh
        const now = new Date();
        const prefix =
          "HA" +
          now.getFullYear().toString().slice(2) +
          String(now.getMonth() + 1).padStart(2, "0");

        const lastImage = await hinhanh.findOne({
          where: { MaHA: { [Op.like]: `${prefix}%` } },
          order: [["MaHA", "DESC"]],
          transaction,
        });

        let newId = prefix + "0001";
        if (lastImage) {
          const num = parseInt(lastImage.MaHA.slice(6)) + 1;
          newId = prefix + num.toString().padStart(4, "0");
        }

        // c. Tạo bản ghi hình ảnh mới
        const newImage = await hinhanh.create(
          {
            MaHA: newId,
            URL: fileUrl,
            MoTa: `Avatar của ${TenDangNhap || account.TenDangNhap}`,
          },
          { transaction }
        );

        // d. Cập nhật tài khoản trỏ về ảnh mới
        account.MaHA_Avatar = newImage.MaHA;
      }

      // 🟢 2. CẬP NHẬT THÔNG TIN KHÁC
      if (HoTen !== undefined) account.HoTen = HoTen;
      if (SDT !== undefined) account.SDT = SDT;
      if (Email !== undefined) account.Email = Email;
      if (TenDangNhap !== undefined) account.TenDangNhap = TenDangNhap;

      await account.save({ transaction });
      await transaction.commit(); // ✅ Lưu tất cả

      // 🟢 3. TRẢ VỀ KẾT QUẢ MỚI NHẤT
      // Lấy lại thông tin đầy đủ (bao gồm ảnh) để trả về frontend
      const updatedAccount = await taikhoan.findByPk(MaTK, {
        include: [{ model: hinhanh, as: "MaHA_Avatar_hinhanh" }],
      });

      // Format dữ liệu trả về
      const responseData = {
        MaTK: updatedAccount.MaTK,
        TenDangNhap: updatedAccount.TenDangNhap,
        HoTen: updatedAccount.HoTen,
        SDT: updatedAccount.SDT,
        Email: updatedAccount.Email,
        Avatar: updatedAccount.MaHA_Avatar_hinhanh
          ? {
              URL: updatedAccount.MaHA_Avatar_hinhanh.URL,
            }
          : null,
      };

      return res.json({
        message: "Cập nhật thông tin thành công",
        data: responseData,
      });
    } catch (err) {
      await transaction.rollback();
      console.error("❌ Lỗi cập nhật thông tin:", err);
      return res.status(500).json({ message: err.message });
    }
  },

  // Đăng ký
  register: async (req, res) => {
    try {
      const { TenDangNhap, Email, MatKhau } = req.body;

      if (!TenDangNhap || !MatKhau) {
        return res.status(400).json({
          message: "Tên đăng nhập và mật khẩu không được để trống",
        });
      }

      const existing = await taikhoan.findOne({ where: { TenDangNhap } });
      if (existing) {
        return res
          .status(400)
          .json({ message: "Tên đăng nhập hoặc email đã tồn tại" });
      }

      // sinh mã tài khoản
      const now = new Date();
      const prefix =
        "TK" +
        now.getFullYear().toString().slice(2) +
        String(now.getMonth() + 1).padStart(2, "0");

      const last = await taikhoan.findOne({
        where: { MaTK: { [Op.like]: `${prefix}%` } },
        order: [["MaTK", "DESC"]],
      });

      let newId = prefix + "0001";
      if (last) {
        const num = parseInt(last.MaTK.slice(6)) + 1;
        newId = prefix + num.toString().padStart(4, "0");
      }

      const hashPass = await bcrypt.hash(MatKhau, 10);
      const newUser = await taikhoan.create({
        MaTK: newId,
        TenDangNhap,
        Email,
        MatKhau: hashPass,
        NgayTao: new Date(),
        TrangThai: "Hoạt động",
      });

      // gán role mặc định
      const khachRole = await vaitro.findOne({
        where: { TenVT: "Khách Hàng" },
      });
      if (khachRole) {
        await taikhoan_vaitro.create({
          MaTK: newUser.MaTK,
          MaVT: khachRole.MaVT,
        });
      } 
      // 🔐 🔥 QUAN TRỌNG: TẠO KEY PAIR NGAY KHI ĐĂNG KÝ
        let keyPairInfo = null;
        try {
            console.log(`🔐 Đang tạo key pair cho user mới: ${newUser.TenDangNhap}`);
            
            // Sử dụng crypto từ import (đã có ở đầu file)
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });

            const keyId = `key_${newUser.MaTK}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
            
            // 🔐 LƯU KEY VÀO DATABASE
            try {               
               // Mã hóa private key đơn giản
                const masterKey = process.env.ENCRYPTION_MASTER_KEY || 'blockchain-master-key-2025';
                const iv = crypto.randomBytes(16);
                const cipher = crypto.createCipheriv('aes-256-gcm', 
                    crypto.scryptSync(masterKey, 'salt', 32), 
                    iv
                );
                
                let encrypted = cipher.update(privateKey, 'utf8', 'hex');
                encrypted += cipher.final('hex');
                const authTag = cipher.getAuthTag();

                // Insert vào database
                await sequelize.query(`
                    INSERT INTO UserKeys 
                    (MaTK, PublicKey, PrivateKeyEncrypted, KeyId, Algorithm, KeySize, CreatedAt, Status, Metadata)
                    VALUES (?, ?, ?, ?, ?, ?, NOW(), 'active', ?)
                `, {
                    replacements: [
                        newUser.MaTK,
                        publicKey,
                        JSON.stringify({
                            encrypted,
                            iv: iv.toString('hex'),
                            authTag: authTag.toString('hex')
                        }),
                        keyId,
                        'RS256',
                        2048,
                        JSON.stringify({
                            generatedAt: new Date().toISOString(),
                            source: 'registration',
                            userAgent: req.headers['user-agent']
                        })
                    ]
                });

                console.log(`✅ Đã tạo và lưu key pair cho user: ${newUser.TenDangNhap}, Key ID: ${keyId}`);
                
                keyPairInfo = {
                    keyId,
                    publicKey,
                    privateKey, // ⚠️ Chỉ trả về lần đầu duy nhất
                    algorithm: 'RS256',
                    keySize: 2048,
                    createdAt: new Date()
                };

            } catch (dbError) {
                console.error('❌ Lỗi lưu key vào database:', dbError);
                // Vẫn trả về key pair, nhưng cảnh báo
                keyPairInfo = {
                    keyId,
                    publicKey,
                    privateKey,
                    warning: 'Key chưa được lưu vào database, vui lòng liên hệ admin',
                    createdAt: new Date()
                };
            }

        } catch (keyError) {
            console.error('❌ Lỗi tạo key pair:', keyError);
            // KHÔNG throw error - vẫn cho đăng ký thành công
            // User có thể tạo key sau
        }

        // 🔥 TRẢ VỀ RESPONSE VỚI KEY PAIR
        const responseData = {
            success: true,
            message: "Đăng ký thành công",
            data: {
                user: {
                    MaTK: newUser.MaTK,
                    TenDangNhap: newUser.TenDangNhap,
                    Email: newUser.Email,
                    NgayTao: newUser.NgayTao
                }
            }
        };

        // Thêm key pair vào response nếu tạo thành công
        if (keyPairInfo) {
            responseData.data.keyPair = keyPairInfo;
            responseData.message += " - Đã tạo chữ ký số";
            
            // ⚠️ CẢNH BÁO QUAN TRỌNG
            responseData.warning = "HÃY LƯU PRIVATE KEY Ở NƠI AN TOÀN! Sẽ không hiển thị lại.";
        }

        return res.json(responseData);

    } catch (err) {
        console.error('❌ Lỗi đăng ký:', err);
        return res.status(500).json({ 
            success: false,
            message: "Lỗi server khi đăng ký",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
},

  // Đăng nhập
  login: async (req, res) => {
    try {
      const { TenDangNhap, MatKhau } = req.body;

      // ✅ Kiểm tra dữ liệu đầu vào
      if (!TenDangNhap || !MatKhau) {
        return res
          .status(400)
          .json({ message: "Thiếu tên đăng nhập hoặc mật khẩu" });
      }

      // 🔍 Tìm user theo TenDangNhap hoặc Email, kèm vai trò
      const user = await taikhoan.findOne({
        where: {
          [Op.or]: [{ TenDangNhap: TenDangNhap }, { Email: TenDangNhap }],
        },
        include: [
          {
            model: taikhoan_vaitro,
            as: "taikhoan_vaitros",
            include: [
              {
                model: vaitro,
                as: "vaitro",
                attributes: ["MaVT", "TenVT"],
              },
            ],
          },
          {
            model: cuahang,
            as: "cuahangs",
            attributes: ["MaCH"],
          },
        ],
      });

      if (!user) {
        return res
          .status(401)
          .json({ message: "Sai tên đăng nhập hoặc mật khẩu" });
      }

      // 🔐 Kiểm tra mật khẩu
      const isMatch = await bcrypt.compare(MatKhau, user.MatKhau);
      // const isMatch = MatKhau === user.MatKhau; // (nếu chưa hash)
      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "Sai tên đăng nhập hoặc mật khẩu" });
      }

      // 📝 Lấy danh sách vai trò từ bảng liên kết
      const roleNames =
        user.taikhoan_vaitros
          ?.map((relation) => relation.vaitro?.TenVT)
          .filter(Boolean) || [];
      // Ưu tiên Admin nếu có, nếu không lấy vai trò đầu tiên làm mặc định
      const primaryRole = roleNames.includes("Admin")
        ? "Admin"
        : roleNames.length > 0
        ? roleNames[0]
        : null;

      const userStoreId = user.cuahangs?.[0]?.MaCH || null;

      // 🧠 Ký JWT
      const token = jwt.sign(
        {
          MaTK: user.MaTK,
          TenDangNhap: user.TenDangNhap,
          role: primaryRole,
          roles: roleNames,
          MaCH: userStoreId,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // ✅ Trả về kết quả
      return res.json({
        message: "Đăng nhập thành công",
        token,
        user: {
          MaTK: user.MaTK,
          TenDangNhap: user.TenDangNhap,
          HoTen: user.HoTen,
          role: primaryRole,
          roles: roleNames,
          MaCH: userStoreId,
        },
      });
    } catch (err) {
      console.error("Lỗi login:", err);
      return res.status(500).json({ message: err.message });
    }
  },

  // Đăng xuất
  logout: async (req, res) => {
    return res.json({ message: "Đăng xuất thành công (xóa token ở client)" });
  },

  // Quên mật khẩu
  forgotPassword: async (req, res) => {
    const { Email } = req.body;
    const user = await taikhoan.findOne({ where: { Email } });
    if (!user) return res.status(404).json({ message: "Email không tồn tại" });

    const resetToken = crypto.randomBytes(32).toString("hex");

    await password_reset_token.create({
      MaTK: user.MaTK,
      resetToken,
      tokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    });

    const link = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail(
      Email,
      "Khôi phục mật khẩu",
      `Nhấn vào link để đặt lại mật khẩu: ${link}`
    );

    return res.json({ message: "Đã gửi email khôi phục mật khẩu" });
  },

  // Reset mật khẩu
  resetPassword: async (req, res) => {
    const { token, newPassword } = req.body;

    const reset = await password_reset_token.findOne({
      where: { resetToken: token },
    });

    if (!reset || reset.tokenExpiry < new Date()) {
      return res
        .status(400)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    const user = await taikhoan.findByPk(reset.MaTK);
    if (!user) {
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }

    user.MatKhau = await bcrypt.hash(newPassword, 10);

    await user.save();
    await reset.destroy();

    return res.json({ message: "Đặt lại mật khẩu thành công" });
  },

  // Đổi mật khẩu
  changePassword: async (req, res) => {
    // Lấy token trực tiếp từ header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Thiếu token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { MaTK } = decoded; // lấy từ JWT middleware
    const { currentPassword, newPassword } = req.body;

    const user = await taikhoan.findByPk(MaTK);
    if (!user)
      return res.status(404).json({ message: "Người dùng không tồn tại" });

    if (!(await bcrypt.compare(currentPassword, user.MatKhau))) {
      return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });
    }

    user.MatKhau = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "Đổi mật khẩu thành công" });
  },
};

export default authController;
