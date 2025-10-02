import { DataTypes, Model } from "sequelize";
export default (sequelize) => {
  class Sanpham extends Model {
    static associate(models) {
      Sanpham.belongsTo(models.cuahang, {
        as: "MaCH_cuahang",
        foreignKey: "MaCH",
      });
      Sanpham.hasMany(models.chitiet_donhang, {
        as: "chitiet_donhangs",
        foreignKey: "MaSP",
      });
      Sanpham.hasMany(models.denghicungcap, {
        as: "denghicungcaps",
        foreignKey: "MaSP",
      });
      Sanpham.hasMany(models.sanpham_danhmuc, {
        as: "sanpham_danhmucs",
        foreignKey: "MaSP",
      });
      Sanpham.hasMany(models.sanpham_hinhanh, {
        as: "sanpham_hinhanhs",
        foreignKey: "MaSP",
      });
      Sanpham.hasMany(models.xuatnhapton_sanpham, {
        as: "xuatnhapton_sanphams",
        foreignKey: "MaSP",
      });
      Sanpham.hasMany(models.yeucaudathang, {
        as: "yeucaudathangs",
        foreignKey: "MaSP",
      });
    }
  }

  Sanpham.init(
    {
      MaSP: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      MaCH: {
        type: DataTypes.STRING(10),
        allowNull: true,
        references: {
          model: "cuahang",
          key: "MaCH",
        },
      },
      TenSP: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      MoTa: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      DVT: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      HSD: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      TrangThai: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      GiaBan: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      NguonGoc: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      SLTon: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "sanpham",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaSP" }],
        },
        {
          name: "idx_sanpham_tensp",
          using: "BTREE",
          fields: [{ name: "TenSP" }],
        },
        {
          name: "idx_sanpham_mach",
          using: "BTREE",
          fields: [{ name: "MaCH" }],
        },
      ],
    }
  );
  return Sanpham;
};
