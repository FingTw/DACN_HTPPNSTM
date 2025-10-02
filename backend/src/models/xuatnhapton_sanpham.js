import { DataTypes, Model } from "sequelize";
export default (sequelize) => {
  class Xuatnhapton_sanpham extends Model {
    static associate(models) {
      Xuatnhapton_sanpham.belongsTo(models.xuatnhapton, {
        as: "MaXNT_xuatnhapton",
        foreignKey: "MaXNT",
      });
      Xuatnhapton_sanpham.belongsTo(models.sanpham, {
        as: "MaSP_sanpham",
        foreignKey: "MaSP",
      });
    }
  }

  Xuatnhapton_sanpham.init(
    {
      MaXNT: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
        references: {
          model: "xuatnhapton",
          key: "MaXNT",
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
      SoLuong: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "xuatnhapton_sanpham",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaXNT" }, { name: "MaSP" }],
        },
        {
          name: "MaSP",
          using: "BTREE",
          fields: [{ name: "MaSP" }],
        },
      ],
    }
  );
  return Xuatnhapton_sanpham;
};
