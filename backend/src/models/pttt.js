import { DataTypes, Model } from "sequelize";
export default (sequelize) => {
  class Pttt extends Model {
    static associate(models) {
      Pttt.hasMany(models.donhang, { as: "donhangs", foreignKey: "MaPTTT" });
    }
  }

  Pttt.init(
    {
      MaPTTT: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      TenPTTT: {
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
      tableName: "pttt",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaPTTT" }],
        },
      ],
    }
  );
  return Pttt;
};
