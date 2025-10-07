import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class Taikhoan_Vaitro extends Model {}

  Taikhoan_Vaitro.init(
    {
      MaTK: {
        type: DataTypes.STRING(10),
        primaryKey: true,
        allowNull: false,
        references: {
          model: "taikhoan",
          key: "MaTK",
        },
      },
      MaVT: {
        type: DataTypes.STRING(10),
        primaryKey: true,
        allowNull: false,
        references: {
          model: "vaitro",
          key: "MaVT",
        },
      },
    },
    {
      sequelize,
      tableName: "taikhoan_vaitro",
      timestamps: false,
    }
  );

  return Taikhoan_Vaitro;
};
