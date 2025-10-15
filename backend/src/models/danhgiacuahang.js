// models/danhgiacuahang.js - MODEL BẮT BUỘC
export default function (sequelize, DataTypes) {
  return sequelize.define(
    "danhgiacuahang",
    {
      MaDG: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      MaCH: {
        type: DataTypes.STRING(10),
        allowNull: false,
        references: {
          model: "cuahang",
          key: "MaCH",
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
    },
    {
      sequelize,
      tableName: "danhgiacuahang",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaDG" }],
        },
        {
          name: "MaCH",
          using: "BTREE",
          fields: [{ name: "MaCH" }],
        },
        {
          name: "MaTK",
          using: "BTREE",
          fields: [{ name: "MaTK" }],
        },
      ],
    }
  );
}
