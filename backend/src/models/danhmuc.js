import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class Danhmuc extends Model {
    static associate(models) {
      Danhmuc.hasMany(models.sanpham_danhmuc, {
        as: "sanpham_danhmucs",
        foreignKey: "MaDM",
      });
      Danhmuc.hasMany(models.yeucaudathang, {
        as: "yeucaudathangs",
        foreignKey: "MaDM",
      });
      Danhmuc.belongsTo(models.hinhanh, {
        as: "MaHA_DanhMuc_hinhanh",
        foreignKey: "MaHA_DanhMuc",
      });
    }
  }

  Danhmuc.init(
    {
      MaDM: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      TenDM: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      MoTa: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      MaHA_DanhMuc: {
        type: DataTypes.STRING(10),
        allowNull: true,
        references: {
          model: "hinhanh",
          key: "MaHA",
        },
      },
    },
    {
      sequelize,
      tableName: "danhmuc",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaDM" }],
        },
        {
          name: "MaHA_DanhMuc",
          using: "BTREE",
          fields: [{ name: "MaHA_DanhMuc" }],
        },
      ],
    }
  );
  return Danhmuc;
};
