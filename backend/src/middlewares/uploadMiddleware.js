// src/middlewares/uploadMiddleware.js
import multer from "multer";
import fs from "fs";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = path.join("public", "uploads", "delivery_proofs");

    // Nếu chưa có folder thì tạo
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `delivery_proofs_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2)}${ext}`;

    cb(null, filename);
  }
});

const upload = multer({ storage });

export default upload;
