import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class Chucvu extends Model {
    static associate(models) {
      Chucvu.hasMany(models.nhanvien, {
        as: "nhanviens",
        foreignKey: "MaCV",
      });
    }
  }

  Chucvu.init(
    {
      MaCV: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      TenCV: {
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
      tableName: "chucvu",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaCV" }],
        },
      ],
    }
  );
  return Chucvu;
};
