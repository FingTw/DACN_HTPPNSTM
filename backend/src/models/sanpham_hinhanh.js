import { DataTypes, Model } from "sequelize";
export default (sequelize) => {
  class Sanpham_hinhanh extends Model {
    static associate(models) {
      Sanpham_hinhanh.belongsTo(models.sanpham, {
        as: "MaSP_sanpham",
        foreignKey: "MaSP",
      });
      Sanpham_hinhanh.belongsTo(models.hinhanh, {
        as: "MaHA_hinhanh",
        foreignKey: "MaHA",
      });
    }
  }

  Sanpham_hinhanh.init(
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
      MaHA: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
        references: {
          model: "hinhanh",
          key: "MaHA",
        },
      },
    },
    {
      sequelize,
      tableName: "sanpham_hinhanh",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaSP" }, { name: "MaHA" }],
        },
        {
          name: "MaHA",
          using: "BTREE",
          fields: [{ name: "MaHA" }],
        },
      ],
    }
  );
  return Sanpham_hinhanh;
};
