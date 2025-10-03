// Script chuyển đổi cú pháp CommonJS Models sang ES Modules
const fs = require("fs");
const path = require("path");

// Định nghĩa thư mục chứa Models
const modelsDir = path.join(__dirname, "src", "models");

function convertToESM(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // 1. Thay thế require('sequelize') và module.exports.define
  // Trong các file Model đơn lẻ (chitiet_donhang.js, v.v.)
  if (path.basename(filePath) !== "init-models.js") {
    content = content.replace(/const Sequelize = require\('sequelize'\);/g, "");
    content = content.replace(
      /module\.exports = function\(sequelize, DataTypes\)/g,
      "export default function(sequelize, DataTypes)"
    );
  } else {
    // 2. Xử lý file init-models.js

    // Thay thế 'var DataTypes = require("sequelize").DataTypes;'
    content = content.replace(
      /var DataTypes = require\("sequelize"\)\.DataTypes;/g,
      'import { DataTypes } from "sequelize";'
    );

    // Thay thế các require Models bằng import (Thêm .js vào cuối)
    content = content.replace(
      /var _(\w+) = require\("\.\/(\w+)"\);/g,
      (match, modelVar, modelFile) => {
        return `import _${modelVar} from "./${modelFile}.js";`;
      }
    );

    // Xóa tất cả các exports CommonJS cũ
    content = content.replace(/module\.exports = initModels;/g, "");
    content = content.replace(/module\.exports\.initModels = initModels;/g, "");
    content = content.replace(/module\.exports\.default = initModels;/g, "");

    // Thêm Named Export mới cho ESM
    content += "\nexport { initModels };\n";
  }

  // 3. Xử lý lỗi trong file init-models.js khi require không được thay thế hết
  content = content.replace(
    /require\("sequelize"\)/g,
    'import Sequelize from "sequelize"'
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ Converted to ESM: ${path.basename(filePath)}`);
}

// Hàm chính để duyệt qua tất cả các file
function processModels() {
  console.log("--- Starting CJS to ESM Conversion ---");

  // Cần phải chạy ở chế độ CJS để dùng require(path)
  if (require.main === module) {
    // Kiểm tra xem modelsDir có tồn tại không
    if (!fs.existsSync(modelsDir)) {
      console.error(`Error: Directory not found: ${modelsDir}`);
      return;
    }

    const files = fs.readdirSync(modelsDir);
    for (const file of files) {
      if (file.endsWith(".js")) {
        const filePath = path.join(modelsDir, file);
        convertToESM(filePath);
      }
    }
    console.log(
      "--- Conversion Complete. Please check your models folder. ---"
    );
  }
}

// Đây là file CJS vì nó dùng require(), nên cần chạy bằng node.
processModels();
