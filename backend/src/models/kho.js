import { DataTypes, Model } from "sequelize";
export default (sequelize) => {
  class Kho extends Model {
    static associate(models) {
      Kho.hasMany(models.xuatnhapton, {
        as: "xuatnhaptons",
        foreignKey: "MaKho",
      });
    }
  }

  Kho.init(
    {
      MaKho: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      TenKho: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      DC: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      SucChua: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "kho",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaKho" }],
        },
      ],
    }
  );
  return Kho;
};
