import { DataTypes, Model } from "sequelize";
export default (sequelize) => {
  class Hinhanh extends Model {
    static associate(models) {
      Hinhanh.hasMany(models.cuahang, {
        as: "cuahangs",
        foreignKey: "MaHA_CuaHang",
      });
      Hinhanh.hasMany(models.danhmuc, {
        as: "danhmucs",
        foreignKey: "MaHA_DanhMuc",
      });
      Hinhanh.hasMany(models.nhanvien, {
        as: "nhanviens",
        foreignKey: "MaHA_Avatar",
      });
      Hinhanh.hasMany(models.sanpham_hinhanh, {
        as: "sanpham_hinhanhs",
        foreignKey: "MaHA",
      });
      Hinhanh.hasMany(models.taikhoan, {
        as: "taikhoans",
        foreignKey: "MaHA_Avatar",
      });
    }
  }

  Hinhanh.init(
    {
      MaHA: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      URL: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      MoTa: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "hinhanh",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaHA" }],
        },
      ],
    }
  );
  return Hinhanh;
};
