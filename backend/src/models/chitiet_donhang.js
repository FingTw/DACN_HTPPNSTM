import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class Chitiet_donhang extends Model {
    static associate(models) {
      Chitiet_donhang.belongsTo(models.donhang, {
        as: "MaDH_donhang",
        foreignKey: "MaDH",
      });
      Chitiet_donhang.belongsTo(models.sanpham, {
        as: "MaSP_sanpham",
        foreignKey: "MaSP",
      });
    }
  }
  Chitiet_donhang.init(
    {
      MaDH: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
        references: {
          model: "donhang",
          key: "MaDH",
        },
      },
      MaSP: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
        references: {
          model: "sanpham",
          key: "MaSP",
        },
      },
      TenSP: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      SoLuong: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      GiaBan: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "chitiet_donhang",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaDH" }, { name: "MaSP" }],
        },
        {
          name: "MaSP",
          using: "BTREE",
          fields: [{ name: "MaSP" }],
        },
      ],
    }
  );
  return Chitiet_donhang;
};
