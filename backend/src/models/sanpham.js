// models/sanpham.js - MODEL ĐÃ CẬP NHẬT
export default function (sequelize, DataTypes) {
  return sequelize.define(
    "sanpham",
    {
      MaSP: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      MaCH: {
        type: DataTypes.STRING(10),
        allowNull: true,
        references: {
          model: "cuahang",
          key: "MaCH",
        },
      },
      TenSP: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      MoTa: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      DVT: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      HSD: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      TrangThai: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      GiaBan: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      NguonGoc: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      SLTon: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // 🆕 THÊM CÁC CỘT ĐÁNH GIÁ
      DiemDG_SP: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      SoLuongDanhGia_SP: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      tableName: "sanpham",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaSP" }],
        },
        {
          name: "idx_sanpham_tensp",
          using: "BTREE",
          fields: [{ name: "TenSP" }],
        },
        {
          name: "idx_sanpham_mach",
          using: "BTREE",
          fields: [{ name: "MaCH" }],
        },
        // 🆕 THÊM INDEX CHO ĐÁNH GIÁ
        {
          name: "idx_sanpham_diemdg",
          using: "BTREE",
          fields: [{ name: "DiemDG_SP" }],
        },
        {
          name: "idx_sanpham_soluongdanhgia",
          using: "BTREE",
          fields: [{ name: "SoLuongDanhGia_SP" }],
        },
      ],
    }
  );
}
