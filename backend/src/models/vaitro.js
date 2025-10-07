import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class Vaitro extends Model {
    static associate(models) {
      Vaitro.belongsToMany(models.taikhoan, {
        through: models.taikhoan_vaitro,
        foreignKey: "MaVT",
        otherKey: "MaTK",
      });
    }
  }

  Vaitro.init(
    {
      MaVT: {
        type: DataTypes.STRING(10),
        primaryKey: true,
        allowNull: false,
      },
      TenVT: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      tableName: "vaitro",
      timestamps: false,
    }
  );

  return Vaitro;
};
