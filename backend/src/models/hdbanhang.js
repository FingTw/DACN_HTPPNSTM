import { DataTypes, Model } from "sequelize";
export default (sequelize) => {
  class Hdbanhang extends Model {
    static associate(models) {
      Hdbanhang.belongsTo(models.taikhoan, {
        as: "MaTK_taikhoan",
        foreignKey: "MaTK",
      });
    }
  }

  Hdbanhang.init(
    {
      MaHD: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      MaTK: {
        type: DataTypes.STRING(10),
        allowNull: true,
        references: {
          model: "taikhoan",
          key: "MaTK",
        },
      },
      NgayLap: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      LoaiHinhKD: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      MaSoThue: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      DCLayHang: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "hdbanhang",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaHD" }],
        },
        {
          name: "MaTK",
          using: "BTREE",
          fields: [{ name: "MaTK" }],
        },
      ],
    }
  );
  return Hdbanhang;
};
