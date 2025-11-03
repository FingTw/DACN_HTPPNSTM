export default function (sequelize, DataTypes) {
  return sequelize.define(
    "chitietchapnhan",
    {
      MaCTCN: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
        comment: "Mã chi tiết chấp nhận",
      },
      MaDNCC: {
        type: DataTypes.STRING(10),
        allowNull: false,
        references: {
          model: "denghicungcap",
          key: "MaDNCC",
        },
        comment: "Mã đề nghị cung cấp",
      },
      MaDH: {
        type: DataTypes.STRING(10),
        allowNull: false, // ⚠️ ĐỔI: Bắt buộc phải có đơn hàng
        references: {
          model: "donhang",
          key: "MaDH",
        },
        comment: "Mã đơn hàng được tạo khi chấp nhận",
      },
      SoLuongChapNhan: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Số lượng người mua quyết định mua từ đề nghị này",
      },
      GiaChapNhan: {
        type: DataTypes.DECIMAL(10, 2), // ✅ THÊM: Giá chấp nhận
        allowNull: false,
        comment: "Giá cuối cùng người mua chấp nhận (VNĐ)",
      },
      NgayChapNhan: {
        type: DataTypes.DATEONLY,
        allowNull: false, // ⚠️ ĐỔI: Bắt buộc phải có ngày
        defaultValue: DataTypes.NOW,
        comment: "Ngày người mua chấp nhận đề nghị",
      },
      GhiChu: {
        type: DataTypes.TEXT, // ✅ THÊM: Ghi chú
        allowNull: true,
        comment: "Ghi chú của người mua khi chấp nhận (VD: giao trước 15h)",
      },
    },
    {
      sequelize,
      tableName: "chitietchapnhan",
      timestamps: false, // Không dùng createdAt, updatedAt
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaCTCN" }],
        },
        {
          name: "idx_chitietchapnhan_madncc",
          using: "BTREE",
          fields: [{ name: "MaDNCC" }],
        },
        {
          name: "idx_chitietchapnhan_madh",
          using: "BTREE",
          fields: [{ name: "MaDH" }],
        },
        {
          name: "idx_chitietchapnhan_ngaychapnhan",
          using: "BTREE",
          fields: [{ name: "NgayChapNhan" }],
        },
      ],
    }
  );
}

/*
ALTER TABLE chitietchapnhan 
ADD COLUMN GiaChapNhan DECIMAL(10,2) NOT NULL COMMENT 'Giá chấp nhận' AFTER SoLuongChapNhan,
ADD COLUMN GhiChu TEXT NULL COMMENT 'Ghi chú' AFTER NgayChapNhan,
MODIFY COLUMN NgayChapNhan DATE NOT NULL DEFAULT (CURRENT_DATE),
MODIFY COLUMN MaDH VARCHAR(10) NOT NULL;

-- Thêm index cho NgayChapNhan
ALTER TABLE chitietchapnhan 
ADD INDEX idx_chitietchapnhan_ngaychapnhan (NgayChapNhan);
*/
