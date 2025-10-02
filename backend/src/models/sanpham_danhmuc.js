import { DataTypes, Model } from "sequelize";
export default (sequelize) => {
  class Sanpham_danhmuc extends Model {
    static associate(models) {
      Sanpham_danhmuc.belongsTo(models.sanpham, {
        as: "MaSP_sanpham",
        foreignKey: "MaSP",
      });
      Sanpham_danhmuc.belongsTo(models.danhmuc, {
        as: "MaDM_danhmuc",
        foreignKey: "MaDM",
      });
    }
  }

  Sanpham_danhmuc.init(
    {
      MaSP: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
        references: {
          model: "sanpham",
          key: "MaSP",
        },
      },
      MaDM: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
        references: {
          model: "danhmuc",
          key: "MaDM",
        },
      },
    },
    {
      sequelize,
      tableName: "sanpham_danhmuc",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaSP" }, { name: "MaDM" }],
        },
        {
          name: "MaDM",
          using: "BTREE",
          fields: [{ name: "MaDM" }],
        },
      ],
    }
  );
  return Sanpham_danhmuc;
};
