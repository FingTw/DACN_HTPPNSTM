// models/danhgiasanpham.js
export default function (sequelize, DataTypes) {
  return sequelize.define(
    "danhgiasanpham",
    {
      MaDG: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      MaSP: {
        type: DataTypes.STRING(10),
        allowNull: false,
        references: {
          model: "sanpham",
          key: "MaSP",
        },
      },
      MaTK: {
        type: DataTypes.STRING(10),
        allowNull: false,
        references: {
          model: "taikhoan",
          key: "MaTK",
        },
      },
      Diem: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      NoiDung: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      NgayDG: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      DaMua: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      HieuLuc: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: "danhgiasanpham",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaDG" }],
        },
        {
          name: "MaSP",
          using: "BTREE",
          fields: [{ name: "MaSP" }],
        },
        {
          name: "MaTK",
          using: "BTREE",
          fields: [{ name: "MaTK" }],
        },
        {
          name: "idx_danhgiasanpham_ngaydg",
          using: "BTREE",
          fields: [{ name: "NgayDG" }],
        },
        {
          name: "idx_danhgiasanpham_diem",
          using: "BTREE",
          fields: [{ name: "Diem" }],
        },
        {
          name: "idx_danhgiasanpham_damua",
          using: "BTREE",
          fields: [{ name: "DaMua" }],
        },
      ],
    }
  );
}
