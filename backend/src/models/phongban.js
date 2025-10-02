import { DataTypes, Model } from "sequelize";
export default (sequelize) => {
  class Phongban extends Model {
    static associate(models) {
      Phongban.hasMany(models.nhanvien, {
        as: "nhanviens",
        foreignKey: "MaPB",
      });
    }
  }

  Phongban.init(
    {
      MaPB: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      TenPB: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      MoTa: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "phongban",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaPB" }],
        },
      ],
    }
  );
  return Phongban;
};
