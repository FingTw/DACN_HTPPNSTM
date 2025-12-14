export default function (sequelize, DataTypes) {
  return sequelize.define(
    "xuatnhapton",
    {
      MaXNT: {
        type: DataTypes.STRING(20),
        allowNull: false,
        primaryKey: true,
      },
      LoaiXNT: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      MaDH: {
        type: DataTypes.STRING(10),
        allowNull: true,
        references: { model: "donhang", key: "MaDH" },
      },
      NgayLap: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      GhiChu: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      MaKho: {
        type: DataTypes.STRING(10),
        allowNull: true,
        references: {
          model: "kho",
          key: "MaKho",
        },
      },
      MaNV: {
        type: DataTypes.STRING(10),
        allowNull: true,
        references: {
          model: "nhanvien",
          key: "MaNV",
        },
      },
    },
    {
      sequelize,
      tableName: "xuatnhapton",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaXNT" }],
        },
        {
          name: "MaKho",
          using: "BTREE",
          fields: [{ name: "MaKho" }],
        },
        {
          name: "MaNV",
          using: "BTREE",
          fields: [{ name: "MaNV" }],
        },
      ],
    }
  );
}
