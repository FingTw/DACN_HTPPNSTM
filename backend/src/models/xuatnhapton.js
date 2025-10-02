import { DataTypes, Model } from "sequelize";
export default (sequelize) => {
  class Xuatnhapton extends Model {
    static associate(models) {
      Xuatnhapton.belongsTo(models.kho, {
        as: "MaKho_kho",
        foreignKey: "MaKho",
      });
      Xuatnhapton.belongsTo(models.nhanvien, {
        as: "MaNV_nhanvien",
        foreignKey: "MaNV",
      });
      Xuatnhapton.hasMany(models.xuatnhapton_sanpham, {
        as: "xuatnhapton_sanphams",
        foreignKey: "MaXNT",
      });
    }
  }

  Xuatnhapton.init(
    {
      MaXNT: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      LoaiXNT: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      NgayLap: {
        type: DataTypes.DATEONLY,
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
  return Xuatnhapton;
};
