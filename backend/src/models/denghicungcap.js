import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class Denghicungcap extends Model {
    static associate(models) {
      Denghicungcap.belongsTo(models.yeucaudathang, {
        as: "MaYCDH_yeucaudathang",
        foreignKey: "MaYCDH",
      });
      Denghicungcap.belongsTo(models.taikhoan, {
        as: "MaTK_Seller_taikhoan",
        foreignKey: "MaTK_Seller",
      });
      Denghicungcap.belongsTo(models.sanpham, {
        as: "MaSP_sanpham",
        foreignKey: "MaSP",
      });
      Denghicungcap.hasMany(models.chitietchapnhan, {
        as: "chitietchapnhans",
        foreignKey: "MaDNCC",
      });
    }
  }

  Denghicungcap.init(
    {
      MaDNCC: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      MaYCDH: {
        type: DataTypes.STRING(10),
        allowNull: false,
        references: {
          model: "yeucaudathang",
          key: "MaYCDH",
        },
      },
      MaTK_Seller: {
        type: DataTypes.STRING(10),
        allowNull: false,
        references: {
          model: "taikhoan",
          key: "MaTK",
        },
      },
      MaSP: {
        type: DataTypes.STRING(10),
        allowNull: true,
        references: {
          model: "sanpham",
          key: "MaSP",
        },
      },
      SoLuongCungCap: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      GiaDeNghi: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      ChatLuongDeNghi: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      NgayDeNghi: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      TrangThai: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: "Chờ",
      },
    },
    {
      sequelize,
      tableName: "denghicungcap",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaDNCC" }],
        },
        {
          name: "MaTK_Seller",
          using: "BTREE",
          fields: [{ name: "MaTK_Seller" }],
        },
        {
          name: "MaSP",
          using: "BTREE",
          fields: [{ name: "MaSP" }],
        },
        {
          name: "idx_denghicungcap_maycdh",
          using: "BTREE",
          fields: [{ name: "MaYCDH" }],
        },
      ],
    }
  );
  return Denghicungcap;
};
