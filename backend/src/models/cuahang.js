import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class Cuahang extends Model {
    static associate(models) {
      Cuahang.belongsTo(models.hinhanh, {
        as: "MaHA_CuaHang_hinhanh",
        foreignKey: "MaHA_CuaHang",
      });
      Cuahang.belongsTo(models.taikhoan, {
        as: "MaTK_taikhoan",
        foreignKey: "MaTK",
      });
    }
  }

  Cuahang.init(
    {
      MaCH: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      TenCH: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      SLTheoDoi: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      DiemDG: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      MaHA_CuaHang: {
        type: DataTypes.STRING(10),
        allowNull: true,
        references: {
          model: "hinhanh",
          key: "MaHA",
        },
      },
      MaTK: {
        type: DataTypes.STRING(10),
        allowNull: true,
        references: {
          model: "taikhoan",
          key: "MaTK",
        },
      },
    },
    {
      sequelize,
      tableName: "cuahang",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaCH" }],
        },
        {
          name: "MaHA_CuaHang",
          using: "BTREE",
          fields: [{ name: "MaHA_CuaHang" }],
        },
        {
          name: "MaTK",
          using: "BTREE",
          fields: [{ name: "MaTK" }],
        },
      ],
    }
  );
  return Cuahang;
};
